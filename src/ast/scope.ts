import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

export { findScopePath, findParentIfPath, getFunctionScopePath };

function findScopePath(path: NodePath<t.Node | null>): NodePath | undefined {
  return path.findParent(
    parentPath =>
      t.isExpressionStatement(parentPath) ||
      (t.isVariableDeclaration(parentPath) &&
        !t.isExportDeclaration(parentPath.parentPath)) ||
      t.isReturnStatement(parentPath) ||
      t.isClassDeclaration(parentPath) ||
      t.isIfStatement(parentPath) ||
      t.isWhileStatement(parentPath) ||
      t.isSwitchStatement(parentPath) ||
      t.isExportDeclaration(parentPath) ||
      t.isForStatement(parentPath)
  );
}

function findParentIfPath(
  path: NodePath<t.Node | null>
): NodePath<t.IfStatement> | undefined {
  return path.findParent(parentPath => t.isIfStatement(parentPath)) as
    | NodePath<t.IfStatement>
    | undefined;
}

function getFunctionScopePath(path: NodePath<t.FunctionDeclaration>): NodePath {
  return path.getFunctionParent() || path.parentPath;
}
