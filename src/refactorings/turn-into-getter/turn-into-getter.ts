import { Editor, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { turnIntoGetter, createVisitor };

async function turnIntoGetter(editor: Editor) {
  const { code, selection } = editor;
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindMethodToConvert);
    return;
  }

  await editor.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path) => {
      if (!t.isIdentifier(path.node.key)) return;

      const references: t.NodePath<t.CallExpression>[] = [];
      path.parentPath.traverse({
        CallExpression(childPath) {
          const { callee } = childPath.node;

          if (!t.isMemberExpression(callee)) return;
          if (!t.isThisExpression(callee.object)) return;
          if (!t.areEquivalent(callee.property, path.node.key)) return;

          references.push(childPath);
        }
      });

      path.node.kind = "get";
      references.forEach((reference) => {
        reference.replaceWith(reference.get("callee"));
      });

      path.stop();
    })
  );
}

function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<t.ClassMethod>) => void
): t.Visitor {
  return {
    ClassMethod(path) {
      if (!selection.isInsidePath(path)) return;

      onMatch(path);
    }
  };
}
