import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { removeDeadCode, hasDeadCode };

async function removeDeadCode(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFoundDeadCode);
    return;
  }

  await editor.write(updatedCode.code);
}

function hasDeadCode(ast: t.AST, selection: Selection): boolean {
  return updateCode(ast, selection).hasCodeChanged;
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(ast, {
    IfStatement(path) {
      if (!selection.isInsidePath(path)) return;

      const { test } = path.node;

      if (t.isFalsy(test)) {
        replaceWithAlternate(path);
        path.stop();
        return;
      }

      if (t.isTruthy(test)) {
        replaceWithConsequent(path);
        path.stop();
        return;
      }

      if (isEmptyIfStatement(path.node)) {
        path.remove();
        path.stop();
        return;
      }

      if (hasEmptyAlternate(path.node)) {
        path.node.alternate = null;
      }

      removeDeadCodeFromBranches(path);
    }
  });
}

function removeDeadCodeFromBranches(path: t.NodePath<t.IfStatement>) {
  const { test } = path.node;

  const target = t.isBinaryExpression(test)
    ? new BinaryExpressionTarget(test)
    : new NoopTarget();

  path.get("consequent").traverse({
    AssignmentExpression: target.checkAssignment.bind(target),

    IfStatement(childPath) {
      if (target.isReassigned) return;
      removeDeadCodeFromNestedIf(test, childPath);
    }
  });

  path.get("alternate").traverse({
    AssignmentExpression: target.checkAssignment.bind(target),

    IfStatement(childPath) {
      if (target.isReassigned) return;

      const oppositeTest = t.isBinaryExpression(test)
        ? {
            ...test,
            operator: t.getOppositeOperator(test.operator)
          }
        : test;

      removeDeadCodeFromNestedIf(oppositeTest, childPath);
    }
  });
}

interface Target {
  isReassigned: boolean;
  checkAssignment(path: t.NodePath<t.AssignmentExpression>): void;
}

class BinaryExpressionTarget implements Target {
  private target: t.Node;
  private _isReassigned = false;

  constructor(expression: t.BinaryExpression) {
    this.target = expression.left;
  }

  get isReassigned() {
    return this._isReassigned;
  }

  checkAssignment(path: t.NodePath<t.AssignmentExpression>) {
    if (t.areEqual(this.target, path.node.left)) {
      this._isReassigned = true;
    }
  }
}

class NoopTarget implements Target {
  isReassigned = false;
  checkAssignment() {}
}

function removeDeadCodeFromNestedIf(
  test: t.IfStatement["test"],
  nestedPath: t.NodePath<t.IfStatement>
) {
  const { test: nestedTest } = nestedPath.node;

  if (isEmptyIfStatement(nestedPath.node)) {
    nestedPath.remove();
    return;
  }

  if (hasEmptyAlternate(nestedPath.node)) {
    nestedPath.node.alternate = null;
  }

  if (t.areOpposite(test, nestedTest)) {
    replaceWithAlternate(nestedPath);
    return;
  }

  if (t.areEqual(test, nestedTest)) {
    replaceWithConsequent(nestedPath);
    return;
  }
}

function hasEmptyAlternate({ alternate }: t.IfStatement): boolean {
  if (!alternate) return true;

  if (t.isIfStatement(alternate)) {
    return isEmptyIfStatement(alternate);
  }

  return t.isEmpty(alternate);
}

function hasEmptyConsequent({ consequent }: t.IfStatement): boolean {
  if (t.isIfStatement(consequent)) {
    return isEmptyIfStatement(consequent);
  }

  return t.isEmpty(consequent);
}

function isEmptyIfStatement(node: t.IfStatement): boolean {
  return hasEmptyConsequent(node) && hasEmptyAlternate(node);
}

function replaceWithAlternate(path: t.NodePath<t.IfStatement>) {
  const { alternate } = path.node;
  alternate ? t.replaceWithBodyOf(path, alternate) : path.remove();
}

function replaceWithConsequent(path: t.NodePath<t.IfStatement>) {
  t.replaceWithBodyOf(path, path.node.consequent);
}
