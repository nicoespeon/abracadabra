import { Editor, ErrorReason } from "../../../editor/editor";
import { Selection } from "../../../editor/selection";
import * as t from "../../../ast";

export {
  addBracesToJsxAttribute,
  createVisitor as hasJsxAttributeToAddBracesTo
};

async function addBracesToJsxAttribute(editor: Editor) {
  const { code, selection } = editor;
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindJsxAttributeToAddBracesTo);
    return;
  }

  await editor.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path) => {
      // Wrap the string literal in a JSX Expression
      if (path.node.value && !t.isJSXExpressionContainer(path.node.value)) {
        path.node.value = t.jsxExpressionContainer(path.node.value);
      }
      path.stop();
    })
  );
}

function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<t.JSXAttribute>) => void
): t.Visitor {
  return {
    JSXAttribute(path) {
      if (!selection.isInsidePath(path)) {
        return;
      }

      if (t.isStringLiteral(path.node.value)) {
        onMatch(path);
      }
    }
  };
}
