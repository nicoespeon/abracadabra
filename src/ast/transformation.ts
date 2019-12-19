import { parse as babelParse } from "@babel/parser";
import traverse, { TraverseOptions, NodePath, Visitor } from "@babel/traverse";
import * as t from "@babel/types";
import * as recast from "recast";

import { Code } from "../editor/editor";
import { findScopePath } from "./scope";

const traverseNode = t.traverse;
const traversePath = traverse;

export { NodePath, Visitor, Scope } from "@babel/traverse";
export {
  generate,
  traverseNode,
  traversePath,
  traverseAST,
  parseAndTraverseCode,
  parse,
  transform,
  transformAST,
  transformCopy,
  Transformed,
  AST
};
export { mergeCommentsInto };

function generate(ast: t.File): Code {
  return recast.print(ast).code;
}

function transform(code: Code, options: TraverseOptions): Transformed {
  const ast = parseAndTraverseCode(code, options);
  const newCode = generate(ast);

  return {
    code: newCode,
    hasCodeChanged: standardizeEOL(newCode) !== standardizeEOL(code)
  };
}

function transformAST(ast: AST, options: TraverseOptions): Transformed {
  const code = recast.print(ast).code;
  const newAst = traverseAST(ast, options);
  const newCode = recast.print(newAst).code;

  return {
    code: newCode,
    hasCodeChanged: standardizeEOL(newCode) !== standardizeEOL(code)
  };
}

function standardizeEOL(code: Code): Code {
  return code.replace(/\r/g, "");
}

function parseAndTraverseCode(code: Code, opts: TraverseOptions): AST {
  return traverseAST(parse(code), opts);
}

function parse(code: Code): AST {
  return recast.parse(code, {
    parser: {
      parse: (source: Code) =>
        babelParse(source, {
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
}

function traverseAST(ast: AST, opts: TraverseOptions): AST {
  traverse(ast, opts);
  return ast;
}

/**
 * If we try to modify the original path, we'll impact all other references.
 * A path can't be cloned.
 *
 * But if we clone the node and insert it in the AST,
 * then we can traverse it and modify it in isolation.
 *
 * It's temporary though.
 * After we're done, we remove the inserted path. #magicTrick ✨
 */
function transformCopy<T extends t.Node>(
  path: NodePath,
  node: T,
  traverseOptions: Visitor
): T {
  const scopePath = findScopePath(path) || path;

  // Cast the type because `insertAfter()` return type is `any`.
  const temporaryCopiedPath = scopePath.insertAfter(
    t.cloneDeep(node)
  )[0] as NodePath<T>;

  temporaryCopiedPath.traverse({
    ...traverseOptions,

    exit(path) {
      preserveCommentsForRecast(path);
    }
  });

  // We need to reference the node before we remove the path.
  const result = temporaryCopiedPath.node;

  temporaryCopiedPath.remove();

  return result;
}

// Recast use a custom `comments` attribute to print comments.
// We need to copy {leading,trailing}Comments to preserve them.
// See: https://github.com/benjamn/recast/issues/572
function preserveCommentsForRecast(path: NodePath) {
  // @ts-ignore Recast does use a `comment` attribute.
  path.node.comments = path.node.leadingComments;

  if (!path.isBlockStatement() && isLastNode()) {
    // @ts-ignore Recast does use a `comments` attribute.
    path.node.comments = [
      ...(path.node.leadingComments || []),
      ...(path.node.trailingComments || [])
    ];
  }

  function isLastNode(): boolean {
    return path.getAllNextSiblings().length === 0;
  }
}

interface Transformed {
  code: Code;
  hasCodeChanged: boolean;
}

type AST = t.File;

function mergeCommentsInto<T extends t.Node>(
  node: T,
  commentedNodes: t.Node[]
): T {
  return {
    ...node,
    comments: commentedNodes.reduce(
      // @ts-ignore Recast does use a `comments` attribute.
      (memo, { comments }) => memo.concat(comments),
      []
    )
  };
}
