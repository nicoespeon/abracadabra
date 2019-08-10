import { parse } from "@babel/parser";
import traverse, { TraverseOptions } from "@babel/traverse";
import * as t from "@babel/types";
import * as recast from "recast";

import { Code } from "../editor/i-write-code";

export { NodePath } from "@babel/traverse";
export { traverseAST, transform, Transformed };

function transform(code: Code, options: TraverseOptions): Transformed {
  const ast = traverseAST(code, options);
  const newCode = recast.print(ast).code;

  return {
    code: newCode,
    hasCodeChanged: newCode !== code
  };
}

function traverseAST(code: Code, opts: TraverseOptions): t.File {
  const ast: t.File = recast.parse(code, {
    parser: {
      parse: (source: Code) =>
        parse(source, {
          sourceType: "module",
          allowImportExportEverywhere: true,
          allowReturnOutsideFunction: true,
          startLine: 1,

          // Tokens are necessary for Recast to do its magic ✨
          tokens: true,

          plugins: [
            "asyncGenerators",
            "bigInt",
            "classPrivateMethods",
            "classPrivateProperties",
            "classProperties",
            "decorators-legacy",
            "doExpressions",
            "dynamicImport",
            "exportDefaultFrom",
            "exportNamespaceFrom",
            "functionBind",
            "functionSent",
            "importMeta",
            "nullishCoalescingOperator",
            "numericSeparator",
            "objectRestSpread",
            "optionalCatchBinding",
            "optionalChaining",
            ["pipelineOperator", { proposal: "minimal" }],
            "throwExpressions",
            "jsx",
            "typescript"
          ]
        })
    }
  });

  traverse(ast, opts);

  return ast;
}

interface Transformed {
  code: Code;
  hasCodeChanged: boolean;
}
