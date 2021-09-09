import { Editor, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { destructureObject, createVisitor };

async function destructureObject(editor: Editor) {
  const { code, selection } = editor;
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindObjectToDestructure);
    return;
  }

  await editor.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path) => {
      const node = t.objectPattern([
        t.objectProperty(
          t.identifier("name"),
          t.identifier("name"),
          false,
          true
        ),
        t.objectProperty(t.identifier("age"), t.identifier("age"), false, true)
      ]);
      node.typeAnnotation = path.node.typeAnnotation;
      path.replaceWith(node);
      path.stop();
    })
  );
}

function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<t.Identifier>) => void
): t.Visitor {
  return {
    Identifier(path) {
      if (!selection.isInsidePath(path)) return;

      onMatch(path);
    }
  };
}
