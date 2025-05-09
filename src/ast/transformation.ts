import {
  parse as babelParse,
  ParserOptions,
  ParserPlugin
} from "@babel/parser";
import traverse, { NodePath, TraverseOptions, Visitor } from "@babel/traverse";
import * as t from "@babel/types";
import * as recast from "recast";
import { Code } from "../editor/editor";
import { findScopePath } from "./scope";

export const traverseNode = t.traverse;
export const traversePath = traverse;

export { Binding, NodePath, Scope } from "@babel/traverse";
export type { TraverseOptions, Visitor };

export function transform(code: Code, options: TraverseOptions): Transformed {
  return transformAST(parse(code), options);
}

export function transformAST(ast: AST, options: TraverseOptions): Transformed {
  const code = print(ast);

  const transformedAST = traverseAST(ast, options);
  const transformedCode = print(transformedAST);
  const hasCodeChanged =
    standardizeEOL(transformedCode) !== standardizeEOL(code);

  // Recast doesn't handle shebangs well: https://github.com/benjamn/recast/issues/376
  // Babel parses it, but Recast messes up the printed code by omitting spaces
  // So we end up with `#!/usr/bin/env nodeconsole.log("Hello World!")`
  // Thus, we need to re-add the space manually.
  const firstToken = transformedAST.tokens?.[0] ?? {};
  const startsWithShebang = firstToken.type?.label?.startsWith("#!");
  const newCode =
    startsWithShebang && hasCodeChanged
      ? transformedCode.replace(
          `#!${firstToken.value}`,
          `#!${firstToken.value}\n\n`
        )
      : transformedCode;

  return {
    code: isUsingTabs(ast) ? indentWithTabs(newCode) : newCode,
    hasCodeChanged
  };
}

export function isUsingTabs(ast: AST | t.Node): boolean {
  let useTabs = false;

  try {
    // @ts-expect-error Recast does add these information
    for (const info of ast.loc.lines.infos) {
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
    .map((line) => {
      const matches = line.match(/^\s+/);
      if (!matches) return line;

      // # of spaces = # of tabs since `tabWidth = 1` when we parse
      const indentationWidth = matches[0].length;
      return "\t".repeat(indentationWidth) + line.slice(indentationWidth);
    })
    .join("\n");
}

export function print(ast: AST | t.Node): Code {
  return recast.print(ast, {
    lineTerminator: "\n"
  }).code;
}

function standardizeEOL(code: Code): Code {
  return code.replace(/\r/g, "");
}

export function parseAndTraverseCode(code: Code, opts: TraverseOptions): AST {
  return traverseAST(parse(code), opts);
}

export function parse(code: Code): AST {
  try {
    return recast.parse(code, {
      parser: {
        parse: (source: Code) =>
          babelParse(source, getBabelParseOptions({ withJSX: true }))
      },
      // VS Code considers tabs to be of size 1
      tabWidth: 1
    });
  } catch {
    // Retry, but disable JSX in case we have type inference on a TS file.
    // Ideally, we would pass the editor language as a param, but this will
    // require a significant refactoring.
    try {
      return recast.parse(code, {
        parser: {
          parse: (source: Code) =>
            babelParse(source, getBabelParseOptions({ withJSX: false }))
        },
        tabWidth: 1
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : error;
      throw new Error(
        `I can't build the AST from the source code. This may be due to a syntax error that you can fix. Here's what went wrong: ${message}`
      );
    }
  }
}

function getBabelParseOptions({
  withJSX
}: {
  withJSX: boolean;
}): ParserOptions {
  const plugins: ParserPlugin[] = [
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
  ];

  if (withJSX) {
    plugins.push("jsx");
  }

  return {
    sourceType: "module",
    allowImportExportEverywhere: true,
    allowReturnOutsideFunction: true,
    startLine: 1,

    // Tokens are necessary for Recast to do its magic ✨
    tokens: true,

    plugins
  };
}

export function traverseAST(ast: AST, opts: TraverseOptions): AST {
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
export function transformCopy<T extends t.Node>(
  path: NodePath,
  node: T,
  traverseOptions: Visitor
): T {
  const scopePath = findScopePath(path) || path;

  // Cast the type because `insertAfter()` return type is `any`.
  const temporaryCopiedPath = scopePath.insertAfter(
    t.cloneNode(node)
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
  const leadingComments = path.node.leadingComments?.map((comment) => ({
    ...comment,
    value: unindent(comment.value)
  }));

  // @ts-expect-error Recast does use a `comments` attribute.
  path.node.comments = leadingComments;

  if (!path.isBlockStatement() && isLastNode()) {
    const trailingComments = path.node.trailingComments?.map((comment) => ({
      ...comment,
      leading: false,
      trailing: true,
      value: unindent(comment.value)
    }));

    // @ts-expect-error Recast does use a `comments` attribute.
    path.node.comments = [
      ...(leadingComments || []),
      ...(trailingComments || [])
    ];
  }

  function isLastNode(): boolean {
    return path.getAllNextSiblings().length === 0;
  }
}

export function addLeadingComment<T extends t.Node>(
  node: T,
  comment: string
): T {
  const commentedNode = t.addComment(node, "leading", ` ${comment} `);

  // @ts-expect-error Recast does use a `comments` attribute.
  commentedNode.comments = commentedNode.leadingComments;

  return commentedNode;
}

function unindent(value: Code): Code {
  return value
    .replace(new RegExp("\n {2}", "g"), "\n")
    .replace(new RegExp("\n\t\t", "g"), "\n");
}

export interface Transformed {
  code: Code;
  hasCodeChanged: boolean;
}

export type AST = t.File;

export function mergeCommentsInto<T extends t.Node>(
  node: T,
  commentedNodes: t.Node[]
): T {
  const comments = commentedNodes.reduce<
    { leading?: boolean; trailing?: boolean }[]
  >(
    // @ts-expect-error Recast does use a `comments` attribute.
    (memo, { comments }) => memo.concat(comments),
    []
  );
  const leadingComments = comments.filter((c) => c?.leading);
  const trailingComments = comments.filter((c) => c?.trailing);
  return {
    ...node,
    leadingComments,
    trailingComments,
    comments
  };
}

export function replaceWithPreservingComments(
  path: NodePath,
  replacement: t.Node | NodePath<t.Node>
) {
  const replacementPath = path.replaceWith(replacement);
  if (replacementPath[0]) {
    preserveCommentsForRecast(replacementPath[0]);
  }
}

export function replaceWithMultiplePreservingComments(
  path: NodePath,
  replacements: readonly t.Node[]
) {
  const replacementPaths = path.replaceWithMultiple(replacements);
  for (const replacementPath of replacementPaths) {
    preserveCommentsForRecast(replacementPath);
  }
}

export type RootNodePath<T = t.Node> = NodePath<T> & {
  parentPath: NodePath<t.Program>;
};

export function isRootNodePath<T = t.Node>(
  path: NodePath<T>
): path is RootNodePath<T> {
  return path.parentPath?.isProgram() ?? false;
}
