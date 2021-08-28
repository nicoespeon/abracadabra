import { parse as babelParse } from "@babel/parser";
import traverse, {
  TraverseOptions,
  NodePath,
  Visitor,
  Binding
} from "@babel/traverse";
import * as t from "@babel/types";
import * as recast from "recast";

import { Code } from "../editor/editor";
import { findScopePath } from "./scope";

const traverseNode = t.traverse;
const traversePath = traverse;

export { NodePath, Visitor, Scope } from "@babel/traverse";
export { RootNodePath, isRootNodePath };
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
  AST,
  isUsingTabs,
  Binding
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
  const newCode = fixShebang(print(traverseAST(ast, options)));

  return {
    code: isUsingTabs(ast) ? indentWithTabs(newCode) : newCode,
    hasCodeChanged: standardizeEOL(newCode) !== standardizeEOL(code)
  };
}

// Recast doesn't handle shebangs well: https://github.com/benjamn/recast/issues/376
// Babel parses it, but Recast messes up the printed code by omitting spaces
function fixShebang(newCode: Code): Code {
  const [, shebang] = newCode.match(/(#![\/\w+]+ node)\w/) || [];
  return shebang ? newCode.replace(shebang, `${shebang}\n\n`) : newCode;
}

function isUsingTabs(ast: AST | t.Node): boolean {
  let useTabs = false;

  try {
    // @ts-expect-error Recast does add these information
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
    .map((line) => {
      const matches = line.match(/^\s+/);
      if (!matches) return line;

      // # of spaces = # of tabs since `tabWidth = 1` when we parse
      const indentationWidth = matches[0].length;
      return "\t".repeat(indentationWidth) + line.slice(indentationWidth);
    })
    .join("\n");
}

function print(ast: AST | t.Node): Code {
  return recast.print(ast).code;
}

function standardizeEOL(code: Code): Code {
  return code.replace(/\r/g, "");
}

function parseAndTraverseCode(code: Code, opts: TraverseOptions): AST {
  return traverseAST(parse(code), opts);
}

function parse(code: Code): AST {
  try {
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
  } catch (error) {
    const message = error instanceof Error ? error.message : error;
    throw new Error(
      `I can't build the AST from the source code. This may be due to a syntax error that you can fix. Here's what went wrong: ${message}`
    );
  }
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

function unindent(value: Code): Code {
  return value
    .replace(new RegExp("\n  ", "g"), "\n")
    .replace(new RegExp("\n\t\t", "g"), "\n");
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
      // @ts-expect-error Recast does use a `comments` attribute.
      (memo, { comments }) => memo.concat(comments),
      []
    )
  };
}

type RootNodePath<T = t.Node> = NodePath<T> & {
  parentPath: NodePath<t.Program>;
};

function isRootNodePath<T = t.Node>(
  path: NodePath<T>
): path is RootNodePath<T> {
  return path.parentPath?.isProgram() ?? false;
}
