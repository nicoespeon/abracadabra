import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

export { findScopePath };

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
      t.isExportDeclaration(parentPath)
  );
}
