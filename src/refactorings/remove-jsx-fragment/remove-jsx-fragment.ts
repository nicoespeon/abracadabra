import * as t from "../../ast";
import { Editor, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";

export async function removeJsxFragment(editor: Editor) {
  const { code, selection } = editor;
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotRemoveJsxFragment);
    return;
  }

  await editor.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path, node) => {
      t.replaceWithPreservingComments(path, node);
    })
  );
}

export function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath, node: t.Node) => void
): t.Visitor {
  return {
    JSXFragment(path) {
      if (!selection.isInsidePath(path)) return;

      const children = path.node.children;
      const jsxElements = children.filter(
        (child) => child.type === "JSXElement"
      );
      if (jsxElements.length !== 1) return;

      path.replaceWith(jsxElements[0]);
      onMatch(path, path.node);
    }
  };
}
