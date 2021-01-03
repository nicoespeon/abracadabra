import { NodePath, Binding } from "@babel/traverse";
import * as t from "@babel/types";
import { getImportDeclarations } from "./domain";

import { areEquivalent } from "./identity";
import { isSelectablePath, SelectablePath } from "./selection";

export {
  findScopePath,
  findParentIfPath,
  getFunctionScopePath,
  isShadowIn,
  findCommonAncestorToDeclareVariable,
  bindingNamesInScope,
  referencesInScope,
  getReferencedImportDeclarations
};

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

function findCommonAncestorToDeclareVariable(
  path: NodePath,
  otherPaths: NodePath[]
): SelectablePath | null {
  let ancestor: NodePath | null = null;

  try {
    // Original type is incorrect, it will return a NodePath or throw
    ancestor = (path.getEarliestCommonAncestorFrom(
      otherPaths
    ) as any) as NodePath;
  } catch {
    // If it fails, it means it couldn't find the earliest ancestor.
    ancestor = getProgramPath(path);
  }

  return findAncestorThatCanHaveVariableDeclaration(ancestor);
}

function getProgramPath(path: NodePath): NodePath {
  const allAncestors = path.getAncestry();
  return allAncestors[allAncestors.length - 1];
}

function findAncestorThatCanHaveVariableDeclaration(
  path: NodePath | null
): SelectablePath | null {
  if (path === null) return null;
  if (isSelectablePath(path)) {
    if (path.isProgram()) return path;
    if (path.isStatement() && !path.isBlockStatement()) return path;
  }

  return findAncestorThatCanHaveVariableDeclaration(path.parentPath);
}

function bindingNamesInScope<T>(path: NodePath<T>): string[] {
  return Object.keys(path.scope.getAllBindings());
}

function referencesInScope<T>(path: NodePath<T>): NodePath[] {
  return Object.values(path.scope.getAllBindings()).flatMap(
    (binding: Binding) => binding.referencePaths
  );
}

function getReferencedImportDeclarations(
  functionPath: NodePath<t.FunctionDeclaration>,
  programPath: NodePath<t.Program>
): t.ImportDeclaration[] {
  let result: t.ImportDeclaration[] = [];

  const importDeclarations = getImportDeclarations(programPath);
  functionPath.get("body").traverse({
    Identifier(path) {
      if (!path.isReferenced()) return;

      importDeclarations.forEach((declaration) => {
        const matchingSpecifier = declaration.specifiers.find(({ local }) =>
          areEquivalent(local, path.node)
        );

        if (matchingSpecifier) {
          result.push({
            ...declaration,
            specifiers: [matchingSpecifier]
          });
        }
      });
    }
  });

  return result;
}
