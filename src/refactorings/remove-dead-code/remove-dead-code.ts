import * as t from "../../ast";
import { Editor, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";

export async function removeDeadCode(editor: Editor) {
  const { code, selection } = editor;
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindDeadCode);
    return;
  }

  await editor.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path, scenario) => {
      switch (scenario) {
        case "empty alternate":
          path.node.alternate = null;
          break;

        case "empty if statement":
          path.remove();
          break;

        case "falsy test":
          replaceWithAlternate(path);
          break;

        case "truthy test":
          replaceWithConsequent(path);
          break;

        case "nested test equal":
          replaceWithConsequent(path);
          break;

        case "nested test opposite":
          replaceWithAlternate(path);
          break;

        default:
          break;
      }
    })
  );
}

export function createVisitor(
  selection: Selection,
  onMatch: OnMatch
): t.Visitor {
  return {
    IfStatement(path) {
      if (!selection.isInsidePath(path)) return;

      const { test } = path.node;

      if (t.isFalsy(test)) {
        onMatch(path, "falsy test");
        return;
      }

      if (t.isTruthy(test)) {
        onMatch(path, "truthy test");
        return;
      }

      if (isEmptyIfStatement(path.node)) {
        onMatch(path, "empty if statement");
        return;
      }

      if (hasEmptyAlternate(path.node)) {
        onMatch(path, "empty alternate");
      }

      checkDeadCodeFromBranches(path, onMatch);
    }
  };
}

function checkDeadCodeFromBranches(
  path: t.NodePath<t.IfStatement>,
  onMatch: OnMatch
) {
  const { test } = path.node;

  const target = t.isBinaryExpression(test)
    ? new BinaryExpressionTarget(test)
    : new NoopTarget();

  path.get("consequent").traverse({
    AssignmentExpression: target.checkAssignment.bind(target),

    IfStatement(childPath) {
      if (target.isReassigned) return;
      checkDeadCodeFromNestedIf(test, childPath, onMatch);
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

      checkDeadCodeFromNestedIf(oppositeTest, childPath, onMatch);
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
    if (t.areEquivalent(this.target, path.node.left)) {
      this._isReassigned = true;
    }
  }
}

class NoopTarget implements Target {
  isReassigned = false;
  checkAssignment() {}
}

function checkDeadCodeFromNestedIf(
  test: t.IfStatement["test"],
  nestedPath: t.NodePath<t.IfStatement>,
  onMatch: OnMatch
) {
  const { test: nestedTest } = nestedPath.node;

  if (isEmptyIfStatement(nestedPath.node)) {
    onMatch(nestedPath, "empty if statement");
    return;
  }

  if (hasEmptyAlternate(nestedPath.node)) {
    onMatch(nestedPath, "empty alternate");
  }

  if (t.areOpposite(test, nestedTest)) {
    onMatch(nestedPath, "nested test opposite");
    return;
  }

  if (t.areEquivalent(test, nestedTest)) {
    onMatch(nestedPath, "nested test equal");
    return;
  }
}

function hasEmptyAlternate({ alternate }: t.IfStatement): boolean {
  if (!alternate) return false;

  if (t.isIfStatement(alternate)) {
    return isEmptyIfStatement(alternate);
  }

  return t.isBlockStatement(alternate) && t.isEmpty(alternate);
}

function hasEmptyConsequent({ consequent }: t.IfStatement): boolean {
  if (t.isIfStatement(consequent)) {
    return isEmptyIfStatement(consequent);
  }

  return t.isBlockStatement(consequent) && t.isEmpty(consequent);
}

function isEmptyIfStatement(node: t.IfStatement): boolean {
  return (
    hasEmptyConsequent(node) && (!node.alternate || hasEmptyAlternate(node))
  );
}

function replaceWithAlternate(path: t.NodePath<t.IfStatement>) {
  const { alternate } = path.node;
  if (alternate) t.replaceWithBodyOf(path, alternate);
  else path.remove();
}

function replaceWithConsequent(path: t.NodePath<t.IfStatement>) {
  t.replaceWithBodyOf(path, path.node.consequent);
}

type DeadCodeScenario =
  | "falsy test"
  | "truthy test"
  | "empty if statement"
  | "empty alternate"
  | "nested test opposite"
  | "nested test equal";

type OnMatch = (
  path: t.NodePath<t.IfStatement>,
  scenario: DeadCodeScenario
) => void;
