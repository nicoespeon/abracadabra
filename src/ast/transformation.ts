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
  print,
  AST
};
export { mergeCommentsInto };

function generate(ast: t.File | t.Node): Code {
  return recast.print(ast).code;
}

function transform(code: Code, options: TraverseOptions): Transformed {
  return transformAST(parse(code), options);
}

function transformAST(ast: AST, options: TraverseOptions): Transformed {
  const code = print(ast);
  const newCode = print(traverseAST(ast, options));

  return {
    code: isUsingTabs(ast) ? indentWithTabs(newCode) : newCode,
    hasCodeChanged: standardizeEOL(newCode) !== standardizeEOL(code)
  };
}

function isUsingTabs(ast: AST): boolean {
  let useTabs = false;

  try {
    // @ts-ignore Recast does add these information
    for (let info of ast.loc.lines.infos) {
      const firstChar = info.line[0];

      if (firstChar === "\t") {
        useTabs = true;
        break;
      } else if (firstChar === " ") {
        useTabs = false;
        break;
      }
    }
  } catch {}

  return useTabs;
}

function indentWithTabs(code: Code): Code {
  return code
    .split("\n")
    .map(line => {
      const matches = line.match(/^\s+/);
      if (!matches) return line;

      // # of spaces = # of tabs since `tabWidth = 1` when we parse
      const indentationWidth = matches[0].length;
      return "\t".repeat(indentationWidth) + line.slice(indentationWidth);
    })
    .join("\n");
}

function print(ast: AST): Code {
  return recast.print(ast).code;
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
            // Not compatible with "decorators-legacy"
            // "decorators",
            "decorators-legacy",
            "doExpressions",
            "dynamicImport",
            // Make tests fail, not sure why
            // "estree",
            "exportDefaultFrom",
            "exportNamespaceFrom",
            // Not compatible with "typescript"
            // "flow",
            // "flowComments",
            "functionBind",
            "functionSent",
            "importMeta",
            "jsx",
            "logicalAssignment",
            "nullishCoalescingOperator",
            "numericSeparator",
            "objectRestSpread",
            "optionalCatchBinding",
            "optionalChaining",
            "partialApplication",
            ["pipelineOperator", { proposal: "minimal" }],
            "placeholders",
            "throwExpressions",
            "topLevelAwait",
            "typescript"
            // Not compatible with "placeholders"
            // "v8intrinsic"
          ]
        })
    },
    // VS Code considers tabs to be of size 1
    tabWidth: 1
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
