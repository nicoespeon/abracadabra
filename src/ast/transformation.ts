import { parse } from "@babel/parser";
import traverse, { TraverseOptions, NodePath, Visitor } from "@babel/traverse";
import * as t from "@babel/types";
import * as recast from "recast";

import { Code } from "../editor/editor";
import { findScopePath } from "./scope";

export { NodePath, Visitor } from "@babel/traverse";
export {
  traverse as traverseAST,
  traverseCode,
  transform,
  transformCopy,
  Transformed
};

function transform(code: Code, options: TraverseOptions): Transformed {
  const ast = traverseCode(code, options);
  const newCode = recast.print(ast).code;

  return {
    code: newCode,
    hasCodeChanged: newCode !== code
  };
}

function traverseCode(code: Code, opts: TraverseOptions): t.File {
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
    // @ts-ignore Recast does use a `comment` attribute.
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
