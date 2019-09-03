import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as ast from "../../ast";

export { mergeIfStatements, canMergeIfStatements };

async function mergeIfStatements(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(code, selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFoundIfStatementsToMerge);
    return;
  }

  await editor.write(updatedCode.code);
}

function canMergeIfStatements(code: Code, selection: Selection): boolean {
  return updateCode(code, selection).hasCodeChanged;
}

function updateCode(code: Code, selection: Selection): ast.Transformed {
  return ast.transform(code, {
    IfStatement(path) {
      if (!selection.isInsidePath(path)) return;

      const { alternate, consequent } = path.node;

      if (alternate) return;

      const nestedStatement = getNestedIfStatementIn(consequent);
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
      if (!selection.isInsidePath(childPath)) return;

      const { alternate, consequent } = childPath.node;
      if (alternate) return;
      if (!getNestedIfStatementIn(consequent)) return;

      result = true;
      childPath.stop();
    }
  });

  return result;
}

function getNestedIfStatementIn(
  statement: ast.Statement
): ast.IfStatement | null {
  if (ast.isBlockStatement(statement) && statement.body.length > 1) {
    return null;
  }

  const nestedIfStatement = ast.isBlockStatement(statement)
    ? statement.body[0] // We tested there is no other element in body.
    : statement;
  if (!ast.isIfStatement(nestedIfStatement)) return null;
  if (nestedIfStatement.alternate) return null;

  return nestedIfStatement;
}
