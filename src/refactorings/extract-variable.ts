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
        extractedCode = getExtractedCode(path.node);
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

function getExtractedCode(
  node:
    | ast.BooleanLiteral
    | ast.Identifier
    | ast.NumericLiteral
    | ast.NullLiteral
    | ast.StringLiteral
): any {
  if (ast.isStringLiteral(node)) {
    // The `raw` value contains the string quotes (" or ').
    return node.extra.raw;
  } else if (ast.isNullLiteral(node)) {
    return null;
  } else if (ast.isUndefinedLiteral(node)) {
    return undefined;
  } else {
    return node.value;
  }
}
