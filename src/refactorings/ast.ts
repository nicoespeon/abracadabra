import { parse } from "@babel/parser";
import traverse, { TraverseOptions, NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import * as recast from "recast";

import { Code } from "../editor/i-write-code";

export { NodePath } from "@babel/traverse";
export * from "@babel/types";
export { ASTSelection, ASTPosition };
export { traverseAST, transform, Transformed };
export { isUndefinedLiteral };
export {
  isSelectableNode,
  isSelectableVariableDeclarator,
  isSelectableIdentifier,
  SelectablePath,
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

function transform(code: Code, options: TraverseOptions): Transformed {
  const ast = traverseAST(code, options);
  const newCode = recast.print(ast).code;

  return {
    code: newCode,
    hasCodeChanged: newCode !== code
  };
}

interface Transformed {
  code: Code;
  hasCodeChanged: boolean;
}

function isUndefinedLiteral(
  node: object | null | undefined,
  opts?: object | null
): node is t.Identifier {
  return t.isIdentifier(node, opts) && node.name === "undefined";
}

type SelectablePath = NodePath<SelectableNode>;
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
