import { parse } from "@babel/parser";
import traverse, { TraverseOptions } from "@babel/traverse";
import * as t from "@babel/types";
import * as recast from "recast";

import { Code } from "./editor/i-write-code";

export { NodePath } from "@babel/traverse";
export * from "@babel/types";
export { ASTSelection, ASTPosition };
export { traverseAST, transform, Transformed };
export { isUndefinedLiteral };
export {
  isSelectableNode,
  isSelectableVariableDeclarator,
  isSelectableIdentifier,
  SelectableNode,
  SelectableObjectProperty,
  SelectableIdentifier,
  SelectableVariableDeclarator,
  Selectable
};

interface ASTSelection {
  start: ASTPosition;
  end: ASTPosition;
}

interface ASTPosition {
  line: number;
  column: number;
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

/**
 * Parse and transform AST from `code`, then return the transformed code.
 *
 * @param code Code to parse and transform
 * @param cb Should return `TraverseOptions` that perform AST transformations.
 * Takes a `selectNode()` argument you can use to select the node to return.
 * By default, the whole AST is returned.
 */
function transform(
  code: Code,
  cb: (selectNode: (node: t.Node) => void) => TraverseOptions
): Transformed {
  let result: t.File | t.Node | null = null;
  let hasSelectedNode = false;

  const ast = traverseAST(
    code,
    cb(node => {
      result = node;
      hasSelectedNode = true;
    })
  );
  if (!result) result = ast;

  return { code: recast.print(result).code, loc: result.loc, hasSelectedNode };
}

interface Transformed {
  code: Code;
  loc: t.SourceLocation | null;
  hasSelectedNode: boolean;
}

function isUndefinedLiteral(
  node: object | null | undefined,
  opts?: object | null
): node is t.Identifier {
  return t.isIdentifier(node, opts) && node.name === "undefined";
}

type SelectableNode = Selectable<t.Node>;
type SelectableObjectProperty = Selectable<t.ObjectProperty>;
type SelectableIdentifier = Selectable<t.Identifier>;
type SelectableVariableDeclarator = Selectable<t.VariableDeclarator>;
type Selectable<T> = T & { loc: t.SourceLocation };

function isSelectableNode(node: t.Node | null): node is SelectableNode {
  return !!node && !!node.loc;
}

function isSelectableIdentifier(node: t.Node): node is SelectableIdentifier {
  return t.isIdentifier(node) && isSelectableNode(node);
}

function isSelectableVariableDeclarator(
  declaration: t.VariableDeclarator
): declaration is SelectableVariableDeclarator {
  return !!declaration.loc;
}
