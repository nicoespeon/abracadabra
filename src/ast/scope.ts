import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

import { areEquivalent } from "./identity";

export { findScopePath, findParentIfPath, getFunctionScopePath, isShadowIn };

function findScopePath(path: NodePath<t.Node | null>): NodePath | undefined {
  return path.findParent(
    (parentPath) =>
      t.isExpressionStatement(parentPath) ||
      (t.isVariableDeclaration(parentPath) &&
        !t.isExportDeclaration(parentPath.parentPath)) ||
      t.isReturnStatement(parentPath) ||
      t.isClassDeclaration(parentPath) ||
      t.isIfStatement(parentPath) ||
      t.isWhileStatement(parentPath) ||
      t.isSwitchStatement(parentPath) ||
      t.isExportDeclaration(parentPath) ||
      t.isForStatement(parentPath) ||
      t.isThrowStatement(parentPath)
  );
}

function findParentIfPath(
  path: NodePath<t.Node | null>
): NodePath<t.IfStatement> | undefined {
  return path.findParent((parentPath) => t.isIfStatement(parentPath)) as
    | NodePath<t.IfStatement>
    | undefined;
}

function getFunctionScopePath(path: NodePath<t.FunctionDeclaration>): NodePath {
  return path.getFunctionParent() || path.parentPath;
}

function isShadowIn(
  id: t.Identifier,
  ancestors: t.TraversalAncestors
): boolean {
  // A variable is "shadow" if one of its ancestor redefines the Identifier.
  return ancestors.some(
    ({ node }) => isDeclaredInFunction(node) || isDeclaredInScope(node)
  );

  function isDeclaredInFunction(node: t.Node): boolean {
    return (
      t.isFunctionDeclaration(node) &&
      node.params.some((node) => areEquivalent(id, node))
    );
  }

  function isDeclaredInScope(node: t.Node): boolean {
    return (
      t.isBlockStatement(node) &&
      node.body.some(
        (child) =>
          t.isVariableDeclaration(child) &&
          child.declarations.some(
            (declaration) =>
              t.isVariableDeclarator(declaration) &&
              areEquivalent(id, declaration.id) &&
              // Of course, if it's the inlined variable it's not a shadow!
              declaration.id !== id
          )
      )
    );
  }
}
