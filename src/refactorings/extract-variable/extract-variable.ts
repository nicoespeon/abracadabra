import { Code, Write } from "../../editor/i-write-code";
import { DelegateToEditor } from "../../editor/i-delegate-to-editor";
import {
  ShowErrorMessage,
  ErrorReason
} from "../../editor/i-show-error-message";
import { Selection } from "../../editor/selection";
import * as ast from "../../ast";
import { renameSymbol } from "../rename-symbol/rename-symbol";

export { extractVariable };

async function extractVariable(
  code: Code,
  selection: Selection,
  write: Write,
  showErrorMessage: ShowErrorMessage,
  delegateToEditor: DelegateToEditor
) {
  const updatedCode = updateCode(code, selection);

  if (!updatedCode.hasCodeChanged) {
    showErrorMessage(ErrorReason.DidNotFoundExtractableCode);
    return;
  }

  await write(updatedCode.code);

  // Extracted symbol is located at `selection` => just trigger a rename.
  await renameSymbol(delegateToEditor);
}

function updateCode(code: Code, selection: Selection): ast.Transformed {
  return ast.transform(code, {
    StringLiteral(path) {
      if (!selection.isInsidePath(path)) return;

      const variableId = ast.identifier("extracted");
      const scopePath = path.parentPath;
      scopePath.insertBefore([
        ast.variableDeclaration("const", [
          ast.variableDeclarator(variableId, path.node)
        ])
      ]);
      path.replaceWith(variableId);
      scopePath.parentPath.stop();
    }
  });
}
