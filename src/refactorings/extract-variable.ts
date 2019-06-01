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

  traverseAST(code, {
    enter(path) {
      if (isStringLiteral(path.node) && path.node.loc) {
        if (selection.start.isEqualTo(Position.fromAST(path.node.loc.start))) {
          extractedCode = path.node.extra.raw;
        }
      }
    }
  });

  const variableName = "extracted";
  const variableDeclaration = `const ${variableName} = ${extractedCode};\n`;

  await writeUpdates([
    { code: variableDeclaration, selection: selection.putCursorAtLineStart() },
    { code: variableName, selection }
  ]);

  // Extracted symbol is located at `selection` => just trigger a rename.
  await renameSymbol(delegateToEditor);
}
