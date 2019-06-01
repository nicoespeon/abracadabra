import { Code, WriteUpdates } from "./i-write-updates";
import { DelegateToEditor } from "./i-delegate-to-editor";
import { renameSymbol } from "./rename-symbol";
import { Selection } from "./selection";
import { traverseAST, isStringLiteral } from "./ast";

export { extractVariable };

async function extractVariable(
  code: Code,
  selection: Selection,
  writeUpdates: WriteUpdates,
  delegateToEditor: DelegateToEditor
) {
  let extractedCode;
  let indentationLevel = 0;
  let extractedSelection = selection;

  traverseAST(code, {
    enter(path) {
      if (!isStringLiteral(path.node)) return;
      if (!path.node.loc) return;

      const selectionInAST = Selection.fromAST(path.node.loc);
      if (selection.isInside(selectionInAST)) {
        extractedCode = path.node.extra.raw;
        extractedSelection = selectionInAST;
        indentationLevel = selection.findIndentationLevel(path);
      }
    }
  });

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
