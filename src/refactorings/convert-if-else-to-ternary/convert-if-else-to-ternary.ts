import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { convertIfElseToTernary, hasIfElseToConvert };

async function convertIfElseToTernary(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFoundIfElseToConvert);
    return;
  }

  await editor.write(updatedCode.code);
}

function hasIfElseToConvert(ast: t.AST, selection: Selection): boolean {
  let result = false;
  t.traverseAST(ast, createVisitor(selection, () => (result = true)));

  return result;
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path, node) => {
      path.replaceWith(node);
      path.stop();
    })
  );
}

function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<t.IfStatement>, node: t.Node) => void
): t.Visitor {
  return {
    IfStatement(path) {
      if (!selection.isInsidePath(path)) return;

      // Use the Chain of Responsibility pattern to add transformation options.
      new ReturnedTernaryMatcher(path)
        .setNext(new AssignedTernaryMatcher(path))
        .setNext(new ImplicitReturnedTernaryMatcher(path))
        .onMatch(node => onMatch(path, node));
    }
  };
}

interface TernaryMatcher {
  setNext(matcher: TernaryMatcher): TernaryMatcher;
  onMatch(convert: Convert): void;
}

type Convert = (node: t.Node) => void;

class NoopMatcher implements TernaryMatcher {
  private next: TernaryMatcher | undefined;

  setNext(converter: TernaryMatcher) {
    if (this.next) {
      this.next.setNext(converter);
    } else {
      this.next = converter;
    }

    return this;
  }

  onMatch(convert: Convert) {
    if (this.next) {
      this.next.onMatch(convert);
    }

    // If no-one matches, do nothing.
  }
}

class ReturnedTernaryMatcher extends NoopMatcher {
  private path: t.NodePath<t.IfStatement>;

  constructor(path: t.NodePath<t.IfStatement>) {
    super();
    this.path = path;
  }

  onMatch(convert: Convert) {
    const statement = this.getReturnStatementTernary();

    if (!statement) {
      return super.onMatch(convert);
    }

    convert(statement);
  }

  private getReturnStatementTernary(): t.ReturnStatement | undefined {
    const { node } = this.path;

    const ifReturnedStatement = t.getReturnedStatement(node.consequent);
    if (!ifReturnedStatement) return;
    if (!ifReturnedStatement.argument) return;

    const elseReturnedStatement = t.getReturnedStatement(node.alternate);
    if (!elseReturnedStatement) return;
    if (!elseReturnedStatement.argument) return;

    let result = t.returnStatement(
      t.conditionalExpression(
        node.test,
        ifReturnedStatement.argument,
        elseReturnedStatement.argument
      )
    );

    result = t.mergeCommentsInto(result, [
      ifReturnedStatement,
      elseReturnedStatement
    ]);

    return result;
  }
}

class ImplicitReturnedTernaryMatcher extends NoopMatcher {
  private path: t.NodePath<t.IfStatement>;
  private implicitReturnPath: t.NodePath<t.ReturnStatement> | undefined;

  constructor(path: t.NodePath<t.IfStatement>) {
    super();
    this.path = path;

    const nextSibling = this.path.getAllNextSiblings()[0];
    if (t.isReturnStatement(nextSibling)) {
      this.implicitReturnPath = nextSibling as t.NodePath<t.ReturnStatement>;
    }
  }

  onMatch(convert: Convert) {
    const statement = this.getReturnStatementTernary();

    if (!statement) {
      return super.onMatch(convert);
    }

    if (this.implicitReturnPath) {
      this.implicitReturnPath.remove();
    }

    convert(statement);
  }

  private getReturnStatementTernary(): t.ReturnStatement | undefined {
    const { node } = this.path;

    const ifReturnedStatement = t.getReturnedStatement(node.consequent);
    if (!ifReturnedStatement) return;
    if (!ifReturnedStatement.argument) return;

    if (!this.implicitReturnPath) return;
    const elseReturnedStatement = this.implicitReturnPath.node;
    if (!elseReturnedStatement.argument) return;

    let result = t.returnStatement(
      t.conditionalExpression(
        node.test,
        ifReturnedStatement.argument,
        elseReturnedStatement.argument
      )
    );

    result = t.mergeCommentsInto(result, [
      ifReturnedStatement,
      elseReturnedStatement
    ]);

    return result;
  }
}

class AssignedTernaryMatcher extends NoopMatcher {
  private path: t.NodePath<t.IfStatement>;

  constructor(path: t.NodePath<t.IfStatement>) {
    super();
    this.path = path;
  }

  onMatch(convert: Convert) {
    const expression = this.getAssignmentExpressionTernary();

    if (!expression) {
      return super.onMatch(convert);
    }

    convert(expression);
  }

  private getAssignmentExpressionTernary(): t.AssignmentExpression | undefined {
    const { node } = this.path;

    const ifAssignedStatement = t.getAssignedStatement(node.consequent);
    if (!ifAssignedStatement) return;

    const elseAssignedStatement = t.getAssignedStatement(node.alternate);
    if (!elseAssignedStatement) return;

    const ifAssignment = ifAssignedStatement.expression;
    const elseAssignment = elseAssignedStatement.expression;

    if (!t.areSameAssignments(ifAssignment, elseAssignment)) {
      return;
    }

    let result = t.assignmentExpression(
      ifAssignment.operator,
      ifAssignment.left,
      t.conditionalExpression(
        node.test,
        ifAssignment.right,
        elseAssignment.right
      )
    );

    result = t.mergeCommentsInto(result, [
      ifAssignedStatement,
      elseAssignedStatement
    ]);

    return result;
  }
}
