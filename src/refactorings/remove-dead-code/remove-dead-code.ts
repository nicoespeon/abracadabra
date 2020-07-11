import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { removeDeadCode, createVisitor as hasDeadCode };

async function removeDeadCode(
  code: Code,
  selection: Selection,
  editor: Editor
) {
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
        case DeadCodeScenario.EmptyAlternate:
          path.node.alternate = null;
          break;

        case DeadCodeScenario.EmptyIfStatement:
          path.remove();
          break;

        case DeadCodeScenario.FalsyTest:
          replaceWithAlternate(path);
          break;

        case DeadCodeScenario.TruthyTest:
          replaceWithConsequent(path);
          break;

        case DeadCodeScenario.NestedTestEqual:
          replaceWithConsequent(path);
          break;

        case DeadCodeScenario.NestedTestOpposite:
          replaceWithAlternate(path);
          break;
      }
    })
  );
}

function createVisitor(selection: Selection, onMatch: OnMatch): t.Visitor {
  return {
    IfStatement(path) {
      if (!selection.isInsidePath(path)) return;

      const { test } = path.node;

      if (t.isFalsy(test)) {
        onMatch(path, DeadCodeScenario.FalsyTest);
        return;
      }

      if (t.isTruthy(test)) {
        onMatch(path, DeadCodeScenario.TruthyTest);
        return;
      }

      if (isEmptyIfStatement(path.node)) {
        onMatch(path, DeadCodeScenario.EmptyIfStatement);
        return;
      }

      if (hasEmptyAlternate(path.node)) {
        onMatch(path, DeadCodeScenario.EmptyAlternate);
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
    onMatch(nestedPath, DeadCodeScenario.EmptyIfStatement);
    return;
  }

  if (hasEmptyAlternate(nestedPath.node)) {
    onMatch(nestedPath, DeadCodeScenario.EmptyAlternate);
  }

  if (t.areOpposite(test, nestedTest)) {
    onMatch(nestedPath, DeadCodeScenario.NestedTestOpposite);
    return;
  }

  if (t.areEquivalent(test, nestedTest)) {
    onMatch(nestedPath, DeadCodeScenario.NestedTestEqual);
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
  alternate ? t.replaceWithBodyOf(path, alternate) : path.remove();
}

function replaceWithConsequent(path: t.NodePath<t.IfStatement>) {
  t.replaceWithBodyOf(path, path.node.consequent);
}

enum DeadCodeScenario {
  FalsyTest,
  TruthyTest,
  EmptyIfStatement,
  EmptyAlternate,
  NestedTestOpposite,
  NestedTestEqual
}

type OnMatch = (
  path: t.NodePath<t.IfStatement>,
  scenario: DeadCodeScenario
) => void;
