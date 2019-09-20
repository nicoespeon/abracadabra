import { singular } from "pluralize";

import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as ast from "../../ast";

export { convertForToForeach, canConvertForLoop };

async function convertForToForeach(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(code, selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFoundForLoopToConvert);
    return;
  }

  await editor.write(updatedCode.code);
}

function canConvertForLoop(code: Code, selection: Selection): boolean {
  return updateCode(code, selection).hasCodeChanged;
}

function updateCode(code: Code, selection: Selection): ast.Transformed {
  return ast.transform(code, {
    ForStatement(path) {
      if (!selection.isInsidePath(path)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      const { test, body } = path.node;
      if (!ast.isBinaryExpression(test)) return;

      const left = test.left;
      if (!ast.isIdentifier(left)) return;

      const right = test.right;
      if (!ast.isMemberExpression(right)) return;
      if (!ast.isIdentifier(right.object)) return;

      const list = right.object;
      const accessor = left;
      const item = ast.identifier(singular(right.object.name));
      const forEachBody = ast.isBlockStatement(body)
        ? body
        : ast.blockStatement([body]);

      replaceListWithItemIn(forEachBody, list, accessor, item, path.scope);

      // After we replaced, we check if there are remaining accessors.
      const params = isAccessorReferencedIn(forEachBody, accessor, path.scope)
        ? [item, accessor]
        : [item];

      path.replaceWith(ast.forEach(list, params, forEachBody));
      path.stop();
    }
  });
}

function hasChildWhichMatchesSelection(
  path: ast.NodePath,
  selection: Selection
): boolean {
  let result = false;

  path.traverse({
    ForStatement(childPath) {
      if (!selection.isInsidePath(childPath)) return;

      const { test } = childPath.node;
      if (!ast.isBinaryExpression(test)) return;

      const left = test.left;
      if (!ast.isIdentifier(left)) return;

      const right = test.right;
      if (!ast.isMemberExpression(right)) return;
      if (!ast.isIdentifier(right.object)) return;

      result = true;
      childPath.stop();
    }
  });

  return result;
}

function replaceListWithItemIn(
  statement: ast.BlockStatement,
  list: ast.Identifier,
  accessor: ast.Identifier,
  item: ast.Identifier,
  scope: ast.Scope
) {
  ast.traverseAST(
    statement,
    {
      MemberExpression(path) {
        if (!ast.areEqual(path.node.object, list)) return;
        if (!ast.areEqual(path.node.property, accessor)) return;
        path.replaceWith(item);
      }
    },
    scope
  );
}

function isAccessorReferencedIn(
  statement: ast.BlockStatement,
  accessor: ast.Identifier,
  scope: ast.Scope
): boolean {
  let result = false;

  ast.traverseAST(
    statement,
    {
      enter(path) {
        if (!ast.areEqual(path.node, accessor)) return;
        result = true;
      }
    },
    scope
  );

  return result;
}
