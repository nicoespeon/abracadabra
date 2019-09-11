import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as ast from "../../ast";

export { mergeWithPreviousIfStatement, canMergeWithPreviousIf };

async function mergeWithPreviousIfStatement(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(code, selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFoundStatementToMerge);
    return;
  }

  await editor.write(updatedCode.code);
}

function canMergeWithPreviousIf(code: Code, selection: Selection): boolean {
  return updateCode(code, selection).hasCodeChanged;
}

function updateCode(code: Code, selection: Selection): ast.Transformed {
  return ast.transform(code, {
    Statement(path) {
      if (!selection.isInsidePath(path)) return;

      const previousSibling = ast.getPreviousSibling(path);
      if (!previousSibling) return;

      const previousNode = previousSibling.node;
      if (!ast.isIfStatement(previousNode)) return;

      mergeWithIfStatement(previousNode, path.node);

      path.remove();
      path.stop();
    }
  });
}

function mergeWithIfStatement(
  ifStatement: ast.IfStatement,
  node: ast.Statement
) {
  const { consequent, alternate } = ifStatement;

  ifStatement.consequent = mergeWith(consequent, node);

  if (!alternate) return;

  if (ast.isIfStatement(alternate)) {
    mergeWithIfStatement(alternate, node);
  } else {
    ifStatement.alternate = mergeWith(alternate, node);
  }
}

function mergeWith(
  branch: ast.Statement,
  statement: ast.Statement
): ast.BlockStatement {
  return ast.blockStatement([...ast.getStatements(branch), statement]);
}
