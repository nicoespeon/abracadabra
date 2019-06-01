import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";

import { Code, Selection, WriteUpdates } from "./i-write-updates";

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
  writeUpdates: WriteUpdates
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
  const variableDeclarationSelection = {
    start: { line: selection.start.line, character: 0 },
    end: { line: selection.start.line, character: 0 }
  };

  await writeUpdates([
    { code: variableDeclaration, selection: variableDeclarationSelection },
    { code: variableName, selection }
  ]);
}
