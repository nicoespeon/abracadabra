import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";

import { Code, WriteUpdates } from "./i-write-updates";
import { DelegateToEditor } from "./i-delegate-to-editor";
import { renameSymbol } from "./rename-symbol";
import { Selection, createSelection } from "./selection";

export { extractVariable };

interface StringLiteral extends t.StringLiteral {
  extra: Extra;
}

interface Extra {
  raw: string;
  rawValue: string;
}

function isStringLiteral(
  node: object | null | undefined,
  opts?: object | null
): node is StringLiteral {
  return t.isStringLiteral(node, opts);
}

async function extractVariable(
  code: Code,
  selection: Selection,
  writeUpdates: WriteUpdates,
  delegateToEditor: DelegateToEditor
) {
  const ast = parse(code, {
    // Parse in strict mode and allow module declarations
    sourceType: "module",

    plugins: [
      "classProperties",
      "classPrivateProperties",
      "classPrivateMethods",
      "jsx",
      "typescript"
    ]
  });

  let extractedCode;

  traverse(ast, {
    enter(path) {
      if (isStringLiteral(path.node)) {
        extractedCode = path.node.extra.raw;
      }
    }
  });

  const variableName = "extracted";
  const variableDeclaration = `const ${variableName} = ${extractedCode};\n`;
  const variableDeclarationSelection = createSelection(
    [selection.start.line, 0],
    [selection.start.line, 0]
  );

  await writeUpdates([
    { code: variableDeclaration, selection: variableDeclarationSelection },
    { code: variableName, selection }
  ]);

  // Extracted symbol is located at `selection` => just trigger a rename.
  await renameSymbol(delegateToEditor);
}
