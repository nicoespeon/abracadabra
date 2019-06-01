import { Code, WriteUpdates } from "./i-write-updates";
import { DelegateToEditor } from "./i-delegate-to-editor";
import { renameSymbol } from "./rename-symbol";
import { Selection } from "./selection";
import { Position } from "./position";
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

  traverseAST(code, {
    enter(path) {
      if (!isStringLiteral(path.node)) return;
      if (!path.node.loc) return;

      if (selection.start.isEqualTo(Position.fromAST(path.node.loc.start))) {
        extractedCode = path.node.extra.raw;
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
    { code: variableName, selection }
  ]);

  // Extracted symbol is located at `selection` => just trigger a rename.
  await renameSymbol(delegateToEditor);
}
