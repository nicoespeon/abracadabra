import { Code, Editor, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";
import { TypeChecker } from "./type-checker";

export { destructureObject, createVisitor };

async function destructureObject(editor: Editor) {
  const { code, selection } = editor;
  const updatedCode = updateCode(code, selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindObjectToDestructure);
    return;
  }

  await editor.write(updatedCode.code);
}

function updateCode(code: Code, selection: Selection): t.Transformed {
  const typeChecker = new TypeChecker(code);
  const keys = typeChecker.getKeys(selection.start);

  if (keys.length === 0) {
    return {
      code,
      hasCodeChanged: false
    };
  }

  return t.transformAST(
    t.parse(code),
    createVisitor(selection, (path) => {
      const node = t.objectPattern(
        keys.map((key) =>
          t.objectProperty(t.identifier(key), t.identifier(key), false, true)
        )
      );
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
