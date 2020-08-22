import { Editor, ErrorReason } from "../../../editor/editor";
import { Selection } from "../../../editor/selection";
import * as t from "../../../ast";

export {
  removeBracesFromJsxAttribute,
  createVisitor as hasBracesToRemoveFromJsxAttribute
};

async function removeBracesFromJsxAttribute(editor: Editor) {
  const { code, selection } = editor;
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindBracesToRemove);
    return;
  }

  await editor.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path) => {
      if (
        t.isJSXAttribute(path.parent) &&
        t.isStringLiteral(path.node.expression)
      ) {
        path.parent.value = t.stringLiteral(path.node.expression.value);
      }
    })
  );
}

function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<t.JSXExpressionContainer>) => void
): t.Visitor {
  return {
    JSXExpressionContainer(path) {
      if (
        selection.isInsidePath(path) &&
        t.isJSXAttribute(path.parent) &&
        t.isStringLiteral(path.node.expression)
      ) {
        onMatch(path);
      }
    }
  };
}
