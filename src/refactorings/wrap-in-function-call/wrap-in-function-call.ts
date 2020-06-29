// TODO: why isn't action appearing?

import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { wrapInFunctionCall, createVisitor };

async function wrapInFunctionCall(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindExpressionToWrap);
    return;
  }

  await editor.write(updatedCode.code);

  if (updatedCode.newSelection === undefined) {
    throw new Error("Expected selection to be defined.");
  }

  editor.select(updatedCode.newSelection);
}

function updateCode(ast: t.AST, selection: Selection) {
  let newSelection: Selection | undefined;

  const calleeIdentifierName = "wrapped";

  const result = t.transformAST(
    ast,
    createVisitor(selection, path => {
      const { node } = path;

      if (!t.isSelectableNode(node)) {
        throw new Error("Expected node to be selectable.");
      }

      // Select the function callee
      newSelection = Selection.fromAST({
        start: node.loc.start,
        end: {
          ...node.loc.start,
          column: node.loc.start.column + calleeIdentifierName.length
        }
      });

      path.replaceWith(
        t.callExpression(t.identifier(calleeIdentifierName), [node])
      );

      path.stop();
    })
  );

  return {
    ...result,
    newSelection
  };
}

function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<t.Expression>) => void
): t.Visitor {
  return {
    Expression(path) {
      if (!selection.isInsidePath(path)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      onMatch(path);
    }
  };
}

function hasChildWhichMatchesSelection(
  path: t.NodePath,
  selection: Selection
): boolean {
  let result = false;

  path.traverse({
    Expression(childPath) {
      if (!selection.isInsidePath(childPath)) return;
      if (
        t.isCallExpression(childPath.parent) &&
        childPath.parent.callee === childPath.node
      )
        return;

      result = true;
      childPath.stop();
    }
  });

  return result;
}
