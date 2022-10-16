import { Editor, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export async function convertIfElseToTernary(editor: Editor) {
  const { code, selection } = editor;
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindIfElseToConvert);
    return;
  }

  await editor.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path, node) => {
      t.replaceWithPreservingComments(path, node);
      path.stop();
    })
  );
}

export function createVisitor(
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
        .onMatch((node) => onMatch(path, node));
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
    return createReturnStatement(
      this.path.node.test,
      t.getReturnedStatement(this.path.node.consequent),
      t.getReturnedStatement(this.path.node.alternate ?? null)
    );
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
    if (!this.implicitReturnPath) return;

    return createReturnStatement(
      this.path.node.test,
      t.getReturnedStatement(this.path.node.consequent),
      this.implicitReturnPath.node
    );
  }
}

function createReturnStatement(
  test: t.Expression,
  consequent: t.ReturnStatement | null,
  alternate: t.ReturnStatement | null
): t.ReturnStatement | undefined {
  if (!consequent) return;
  if (!consequent.argument) return;

  if (!alternate) return;
  if (!alternate.argument) return;

  let result = t.returnStatement(
    t.conditionalExpression(test, consequent.argument, alternate.argument)
  );
  result = t.mergeCommentsInto(result, [consequent, alternate]);

  return result;
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

    const elseAssignedStatement = t.getAssignedStatement(
      node.alternate ?? null
    );
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
