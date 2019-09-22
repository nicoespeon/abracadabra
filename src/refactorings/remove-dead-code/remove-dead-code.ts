import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as ast from "../../ast";

export { removeDeadCode, hasDeadCode };

async function removeDeadCode(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(code, selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFoundDeadCode);
    return;
  }

  await editor.write(updatedCode.code);
}

function hasDeadCode(code: Code, selection: Selection): boolean {
  return updateCode(code, selection).hasCodeChanged;
}

function updateCode(code: Code, selection: Selection): ast.Transformed {
  return ast.transform(code, {
    IfStatement(path) {
      if (!selection.isInsidePath(path)) return;

      const { test } = path.node;

      if (ast.isFalsy(test)) {
        replaceWithAlternate(path);
        path.stop();
        return;
      }

      if (ast.isTruthy(test)) {
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

function removeDeadCodeFromBranches(path: ast.NodePath<ast.IfStatement>) {
  const { test } = path.node;

  path.get("consequent").traverse({
    IfStatement(childPath) {
      removeDeadCodeFromNestedIf(test, childPath);
    }
  });

  path.get("alternate").traverse({
    IfStatement(childPath) {
      const oppositeTest = ast.isBinaryExpression(test)
        ? {
            ...test,
            operator: ast.getOppositeOperator(test.operator)
          }
        : test;

      removeDeadCodeFromNestedIf(oppositeTest, childPath);
    }
  });
}

function removeDeadCodeFromNestedIf(
  test: ast.IfStatement["test"],
  nestedPath: ast.NodePath<ast.IfStatement>
) {
  const { test: nestedTest } = nestedPath.node;

  if (isEmptyIfStatement(nestedPath.node)) {
    nestedPath.remove();
    return;
  }

  if (hasEmptyAlternate(nestedPath.node)) {
    nestedPath.node.alternate = null;
  }

  if (ast.areOpposite(test, nestedTest)) {
    replaceWithAlternate(nestedPath);
    return;
  }

  if (ast.areEqual(test, nestedTest)) {
    replaceWithConsequent(nestedPath);
    return;
  }
}

function hasEmptyAlternate({ alternate }: ast.IfStatement): boolean {
  if (!alternate) return true;

  if (ast.isIfStatement(alternate)) {
    return isEmptyIfStatement(alternate);
  }

  return ast.isEmpty(alternate);
}

function hasEmptyConsequent({ consequent }: ast.IfStatement): boolean {
  if (ast.isIfStatement(consequent)) {
    return isEmptyIfStatement(consequent);
  }

  return ast.isEmpty(consequent);
}

function isEmptyIfStatement(node: ast.IfStatement): boolean {
  return hasEmptyConsequent(node) && hasEmptyAlternate(node);
}

function replaceWithAlternate(path: ast.NodePath<ast.IfStatement>) {
  const { alternate } = path.node;
  alternate ? ast.replaceWithBodyOf(path, alternate) : path.remove();
}

function replaceWithConsequent(path: ast.NodePath<ast.IfStatement>) {
  ast.replaceWithBodyOf(path, path.node.consequent);
}
