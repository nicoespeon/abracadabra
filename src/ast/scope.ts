import { Binding, NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { first } from "../array";
import { getImportDeclarations, TypeDeclaration } from "./domain";
import {
  areEquivalent,
  isFunctionDeclarationOrArrowFunction
} from "./identity";
import { isSelectablePath, SelectablePath } from "./selection";

export function findScopePath(path: NodePath<t.Node | null>): NodePath | null {
  return path.findParent(
    (parentPath) =>
      t.isExpressionStatement(parentPath) ||
      (t.isVariableDeclaration(parentPath) &&
        !t.isExportDeclaration(parentPath.parentPath)) ||
      t.isReturnStatement(parentPath) ||
      t.isClassDeclaration(parentPath) ||
      (t.isIfStatement(parentPath) &&
        !t.isIfStatement(parentPath.parentPath)) ||
      t.isWhileStatement(parentPath) ||
      t.isSwitchStatement(parentPath) ||
      t.isExportDeclaration(parentPath) ||
      t.isForStatement(parentPath) ||
      t.isForOfStatement(parentPath) ||
      t.isThrowStatement(parentPath)
  );
}

export function findParentIfPath(
  path: NodePath<t.Node | null>
): NodePath<t.IfStatement> | undefined {
  return path.findParent((parentPath) => t.isIfStatement(parentPath)) as
    | NodePath<t.IfStatement>
    | undefined;
}

export function getFunctionScopePath(
  path: NodePath<t.FunctionDeclaration>
): NodePath {
  return path.getFunctionParent() || path.parentPath;
}

export function isShadowIn(
  id: t.Identifier,
  ancestors: t.TraversalAncestors
): boolean {
  // A variable is "shadow" if one of its ancestor redefines the Identifier.
  return ancestors.some(
    ({ node }) => isDeclaredInFunction(node) || isDeclaredInScope(node)
  );

  function isDeclaredInFunction(node: t.Node): boolean {
    return (
      isFunctionDeclarationOrArrowFunction(node) &&
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

export function findFirstExistingDeclaration(
  expressionPath: NodePath<t.Expression>
) {
  const existingDeclarations: NodePath<DestructuredVariableDeclarator>[] =
    Object.values(expressionPath.scope.getAllBindings())
      .map(({ path }) => path as NodePath)
      .filter(
        (path): path is NodePath<DestructuredVariableDeclarator> =>
          path.isVariableDeclarator() &&
          path.get("id").isObjectPattern() &&
          path.get("init").isIdentifier()
      )
      .filter((path) => areEquivalent(expressionPath.node, path.node.init));

  return first(existingDeclarations);
}

type DestructuredVariableDeclarator = t.VariableDeclarator & {
  id: t.ObjectPattern;
  init: t.Identifier;
};

export function findCommonAncestorToDeclareVariable(
  path: NodePath,
  otherPaths: NodePath[]
): SelectablePath | null {
  let ancestor: NodePath | null = null;

  try {
    // Original type is incorrect, it will return a NodePath or throw
    ancestor = path.getEarliestCommonAncestorFrom(
      otherPaths
    ) as any as NodePath;
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

export function findAncestorThatCanHaveVariableDeclaration<T extends t.Node>(
  path: NodePath<T> | null
): SelectablePath<T> | null {
  if (path === null) return null;
  if (isSelectablePath(path)) {
    // @ts-expect-error Not sure how to solve, looks like a typedef issue
    if (path.isProgram()) return path;
    // @ts-expect-error Not sure how to solve, looks like a typedef issue
    if (path.isStatement() && !path.isBlockStatement()) return path;
  }

  // @ts-expect-error Not sure how to solve, looks like a typedef issue
  return findAncestorThatCanHaveVariableDeclaration(path.parentPath);
}

export function bindingNamesInScope<T>(path: NodePath<T>): string[] {
  return Object.keys(path.scope.getAllBindings());
}

export function selectableReferencesInScope(
  path: NodePath<t.Identifier>
): SelectablePath[] {
  const bindings = path.scope.getAllBindings() as Record<string, Binding>;
  const pathBinding = bindings[path.node.name] as Binding | undefined;
  if (!pathBinding) return [];

  const referencePaths = [pathBinding.path, ...pathBinding.referencePaths];
  // May be fragile to get the exact grand-grand-parent path…
  // But it passes the tests so far!
  pathBinding.path.parentPath?.parentPath?.traverse({
    Identifier(childPath) {
      if (childPath.node.name !== path.node.name) return;
      // We already counted the refs
      if (t.isReferenced(childPath.node, childPath.parent)) return;
      if (t.isDeclaration(childPath.parent)) return;
      if (t.isPattern(childPath.parent)) return;
      if (t.isMemberExpression(childPath.parent)) return;

      referencePaths.push(childPath);
    }
  });

  return referencePaths
    .filter((path) => t.isIdentifier(path))
    .filter(isSelectablePath);
}

export function referencesInScope(
  path: NodePath<t.FunctionDeclaration | t.FunctionExpression>
): NodePath[] {
  const functionName = path.node.id?.name;
  const allBindings = Object.values(
    path.scope.getAllBindings()
  ) as FunctionBinding[];

  return allBindings
    .filter(
      // Ensure bindings are of the correct type and we don't get more
      (binding) =>
        binding.path.isFunctionDeclaration() ||
        binding.path.isFunctionExpression()
    )
    .filter(({ path }) => path.node.id?.name === functionName)
    .flatMap((binding) => binding.referencePaths);
}

type FunctionBinding = Binding & {
  path: NodePath<t.FunctionDeclaration | t.FunctionExpression>;
};

export function getReferencedImportDeclarations(
  path: NodePath<t.BlockStatement | t.Expression | null | undefined>,
  programPath: NodePath<t.Program>
): t.ImportDeclaration[] {
  const result: t.ImportDeclaration[] = [];

  const importDeclarations = getImportDeclarations(programPath);
  path.traverse({
    Identifier(identifierPath) {
      if (!identifierPath.isReferenced()) return;

      importDeclarations.forEach((declaration) => {
        const matchingSpecifier = declaration.specifiers.find(({ local }) =>
          areEquivalent(local, identifierPath.node)
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

export function getTypeReferencedImportDeclarations(
  typePath: NodePath<TypeDeclaration>,
  programPath: NodePath<t.Program>
): t.ImportDeclaration[] {
  const result: t.ImportDeclaration[] = [];

  const importDeclarations = getImportDeclarations(programPath);
  typePath.traverse({
    TSTypeReference(path) {
      if (!path.isReferenced()) return;

      importDeclarations.forEach((declaration) => {
        const matchingSpecifier = declaration.specifiers.find(({ local }) =>
          areEquivalent(local, path.node.typeName)
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

export function hasReferencesDefinedInSameScope(
  path: NodePath,
  bodyPath: NodePath<t.BlockStatement | t.Expression | null | undefined>,
  nodesToExclude: (t.Node | null)[],
  programPath: NodePath<t.Program>
): boolean {
  let result = false;

  const scopeReferencesNames = bindingNamesInScope(path);
  const importDeclarations = getImportDeclarations(programPath);
  const importReferencesNames = importDeclarations
    .flatMap(({ specifiers }) => specifiers)
    .map(({ local }) => local.name);
  const excludedNames = nodesToExclude.flatMap(getNames);
  const referencesDefinedInSameScope = scopeReferencesNames
    .filter((name) => !importReferencesNames.includes(name))
    .filter((name) => !excludedNames.includes(name));

  bodyPath.traverse({
    Identifier(identifierPath) {
      if (!identifierPath.isReferenced()) return;

      if (referencesDefinedInSameScope.includes(identifierPath.node.name)) {
        result = true;
        identifierPath.stop();
      }
    }
  });

  return result;
}

export function hasTypeReferencesDefinedInSameScope(
  typePath: NodePath<TypeDeclaration>
): boolean {
  let result = false;

  const generics =
    typePath.node.typeParameters?.params.map((p) => p.name) ?? [];

  typePath.traverse({
    TSTypeReference(path) {
      if (!path.isReferenced()) return;
      if (!t.isIdentifier(path.node.typeName)) return;
      if (generics.includes(path.node.typeName.name)) return;

      if (typePath.scope.hasGlobal(path.node.typeName.name)) {
        result = true;
        path.stop();
      }
    }
  });

  return result;
}

function getNames(node: t.Node | null): string[] {
  if (t.isArrayPattern(node)) return node.elements.flatMap(getNames);
  if (t.isAssignmentPattern(node)) return getNames(node.left);
  if (t.isIdentifier(node)) return [node.name];
  if (t.isRestElement(node)) return getNames(node.argument);
  if (t.isObjectPattern(node)) return node.properties.flatMap(getNames);
  if (t.isObjectProperty(node)) return getNames(node.key);
  return [];
}
