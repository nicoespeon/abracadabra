import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";

import { Code, WriteUpdates } from "./i-write-updates";
import { DelegateToEditor } from "./i-delegate-to-editor";
import { renameSymbol } from "./rename-symbol";
import { Selection } from "./selection";
import { Position } from "./position";

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
