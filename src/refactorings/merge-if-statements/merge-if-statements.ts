import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as ast from "../../ast";

export { mergeIfStatements, tryMergeIfStatements };

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

function tryMergeIfStatements(
  code: Code,
  selection: Selection
): { canMerge: boolean; mergeAlternate: boolean } {
  const updatedCode = updateCode(code, selection);

  return {
    canMerge: updatedCode.hasCodeChanged,
    mergeAlternate: updatedCode.mergeAlternate
  };
}

function updateCode(
  code: Code,
  selection: Selection
): ast.Transformed & { mergeAlternate: boolean } {
  let mergeAlternate = false;

  const result = ast.transform(code, {
    IfStatement(path) {
      if (!selection.isInsidePath(path)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      const { alternate, consequent } = path.node;

      if (alternate) {
        mergeAlternate = true;
        mergeAlternateWithNestedIf(path, alternate);
      } else {
        mergeAlternate = false;
        mergeConsequentWithNestedIf(path, consequent);
      }
    }
  });

  return { ...result, mergeAlternate };
}

function mergeAlternateWithNestedIf(
  path: ast.NodePath<ast.IfStatement>,
  alternate: ast.IfStatement["alternate"]
) {
  if (!ast.isBlockStatement(alternate)) return;

  const nestedStatement = getNestedIfStatementIn(alternate);
  if (!nestedStatement) return;

  path.node.alternate = nestedStatement;
  path.stop();
}

function mergeConsequentWithNestedIf(
  path: ast.NodePath<ast.IfStatement>,
  consequent: ast.IfStatement["consequent"]
) {
  const nestedIfStatement = getNestedIfStatementIn(consequent);
  if (!nestedIfStatement) return;
  if (nestedIfStatement.alternate) return;

  path.node.test = ast.logicalExpression(
    "&&",
    path.node.test,
    nestedIfStatement.test
  );
  path.node.consequent = ast.blockStatement(
    ast.getStatements(nestedIfStatement.consequent)
  );

  path.stop();
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

      if (alternate) {
        if (!ast.isBlockStatement(alternate)) return;

        const nestedIfStatement = getNestedIfStatementIn(alternate);
        if (!nestedIfStatement) return;
      } else {
        const nestedIfStatement = getNestedIfStatementIn(consequent);
        if (!nestedIfStatement) return;
        if (nestedIfStatement.alternate) return;
      }

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

  return nestedIfStatement;
}
