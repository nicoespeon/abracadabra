import { Code, Write } from "../../editor/i-write-code";
import { Selection } from "../../editor/selection";
import {
  ShowErrorMessage,
  ErrorReason
} from "../../editor/i-show-error-message";
import * as ast from "../../ast";

export { mergeIfStatements, canMergeIfStatements };

async function mergeIfStatements(
  code: Code,
  selection: Selection,
  write: Write,
  showErrorMessage: ShowErrorMessage
) {
  const updatedCode = updateCode(code, selection);

  if (!updatedCode.hasCodeChanged) {
    showErrorMessage(ErrorReason.DidNotFoundIfStatementsToMerge);
    return;
  }

  await write(updatedCode.code);
}

function canMergeIfStatements(code: Code, selection: Selection): boolean {
  return updateCode(code, selection).hasCodeChanged;
}

function updateCode(code: Code, selection: Selection): ast.Transformed {
  return ast.transform(code, {
    IfStatement(path) {
      const nestedStatement = getMatchingNestedStatement(path, selection);
      if (!nestedStatement) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      const nestedConsequent = nestedStatement.consequent;
      const nestedConsequentStatements = ast.isBlockStatement(nestedConsequent)
        ? nestedConsequent.body
        : [nestedConsequent];

      path.node.test = ast.logicalExpression(
        "&&",
        path.node.test,
        nestedStatement.test
      );
      path.node.consequent = ast.blockStatement(nestedConsequentStatements);

      path.stop();
    }
  });
}

function hasChildWhichMatchesSelection(
  path: ast.NodePath,
  selection: Selection
): boolean {
  let result = false;

  path.traverse({
    IfStatement(childPath) {
      if (!getMatchingNestedStatement(childPath, selection)) return;
      result = true;
      childPath.stop();
    }
  });

  return result;
}

function getMatchingNestedStatement(
  path: ast.NodePath<ast.IfStatement>,
  selection: Selection
): ast.IfStatement | null {
  if (!selection.isInsidePath(path)) return null;
  if (path.node.alternate) return null;

  const { consequent } = path.node;
  if (ast.isBlockStatement(consequent) && consequent.body.length > 1) {
    return null;
  }

  const nestedStatement = ast.isBlockStatement(consequent)
    ? consequent.body[0] // We tested there is no other element in body.
    : consequent;
  if (!ast.isIfStatement(nestedStatement)) return null;
  if (nestedStatement.alternate) return null;

  return nestedStatement;
}
