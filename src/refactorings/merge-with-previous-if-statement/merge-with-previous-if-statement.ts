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
      const previousSibling = ast.getPreviousSibling(path);
      if (!previousSibling) return;

      const previousNode = previousSibling.node;
      if (!ast.isIfStatement(previousNode)) return;

      previousNode.consequent = mergeWith(previousNode.consequent, path.node);

      if (previousNode.alternate) {
        previousNode.alternate = mergeWith(previousNode.alternate, path.node);
      }

      path.remove();
      path.stop();
    }
  });
}

function mergeWith(
  branch: ast.Statement,
  statement: ast.Statement
): ast.BlockStatement {
  return ast.blockStatement([...ast.getStatements(branch), statement]);
}
