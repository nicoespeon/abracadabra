import { Code, WriteUpdates } from "./i-write-updates";
import { DelegateToEditor } from "./i-delegate-to-editor";
import { ShowErrorMessage, ErrorReason } from "./i-show-error-message";
import { renameSymbol } from "./rename-symbol";
import { Selection } from "./selection";
import * as ast from "./ast";

export { extractVariable };

async function extractVariable(
  code: Code,
  selection: Selection,
  writeUpdates: WriteUpdates,
  delegateToEditor: DelegateToEditor,
  showErrorMessage: ShowErrorMessage
) {
  let extractedCode;
  let foundExtractedCode = false;
  let indentationLevel = 0;
  let extractedSelection = selection;

  ast.traverseAST(code, {
    enter(path) {
      if (
        !ast.isStringLiteral(path.node) &&
        !ast.isNumericLiteral(path.node) &&
        !ast.isBooleanLiteral(path.node) &&
        !ast.isNullLiteral(path.node) &&
        !ast.isUndefinedLiteral(path.node)
      ) {
        return;
      }
      if (!path.node.loc) return;

      const selectionInAST = Selection.fromAST(path.node.loc);
      if (selection.isInside(selectionInAST)) {
        // If extracted code is a string, we want the raw value with the quotes.
        extractedCode = ast.isStringLiteral(path.node)
          ? path.node.extra.raw
          : ast.isNullLiteral(path.node)
          ? null
          : ast.isUndefinedLiteral(path.node)
          ? undefined
          : path.node.value;
        foundExtractedCode = true;
        extractedSelection = selectionInAST;
        indentationLevel = selection.findIndentationLevel(path);
      }
    }
  });

  if (!foundExtractedCode) {
    showErrorMessage(ErrorReason.DidNotFoundExtractedCode);
    return;
  }

  const variableName = "extracted";
  const indentation = " ".repeat(indentationLevel);
  const variableDeclaration = `const ${variableName} = ${extractedCode};\n${indentation}`;

  await writeUpdates([
    {
      code: variableDeclaration,
      selection: selection.putCursorAtColumn(indentationLevel)
    },
    { code: variableName, selection: extractedSelection }
  ]);

  // Extracted symbol is located at `selection` => just trigger a rename.
  await renameSymbol(delegateToEditor);
}
