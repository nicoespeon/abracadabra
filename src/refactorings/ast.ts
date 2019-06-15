import { parse } from "@babel/parser";
import traverse, { TraverseOptions } from "@babel/traverse";
import generate from "@babel/generator";
import * as t from "@babel/types";

import { Code } from "./i-update-code";

export { NodePath } from "@babel/traverse";
export * from "@babel/types";
export { traverseAST, transform, isUndefinedLiteral };
export { ASTSelection, ASTPosition };
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

function traverseAST(code: Code, opts: TraverseOptions): void {
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

  traverse(ast, opts);
}

/**
 * @param code The code to parse and transform
 * @param cb Function taking a `setNode` callback to set the transformed `code`.
 */
function transform(
  code: Code,
  cb: (setNode: (node: t.Node) => void) => TraverseOptions
): Code | undefined {
  let result: t.Node | undefined;

  traverseAST(
    code,
    cb(node => {
      // Only set once to take the transformed node from the top-most ancestor.
      // This works because nodes are visited from top to bottom.
      // Further visited children should mutate the references.
      if (!result) result = node;
    })
  );
  if (!result) return;

  const generatedResult = generate(result);
  if (!generatedResult || !generatedResult.code) return;

  return generatedResult.code;
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
