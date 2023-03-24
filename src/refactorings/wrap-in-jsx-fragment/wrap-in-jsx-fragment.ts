import * as t from "../../ast";
import { Editor, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";

export async function wrapInJsxFragment(editor: Editor) {
  const { code, selection } = editor;
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.CouldNotWrapInJsxFragment);
    return;
  }

  await editor.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path, node) => {
      // TODO: implement the transformation here 🧙‍
      t.replaceWithPreservingComments(path, node);
      path.stop();
    })
  );
}

export function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath, node: t.Node) => void
): t.Visitor {
  // TODO: implement the check here 🧙‍
  return {
    JSXElement(path) {
      if (!selection.isInsidePath(path)) return;

      const fragment = t.jsxFragment(
        t.jsxOpeningFragment(),
        t.jsxClosingFragment(),
        [path.node]
      );
      path.replaceWith(fragment);
      onMatch(path, path.node);
    }
  };
}
