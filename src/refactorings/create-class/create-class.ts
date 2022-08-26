import { Editor, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";
import { NewExpression } from "../../ast";

export async function createClass(editor: Editor) {
  const { code, selection } = editor;
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.CantCreateClass);
    return;
  }

  await editor.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path) => {
      const node = path.node;
      const callee = node.callee;
      if (t.isIdentifier(callee)) {
        const classDeclaration = t.classDeclaration(
          t.identifier(callee.name),
          null,
          t.classBody([])
        );

        const isExported = t.isExportDeclaration(path.parent);
        if (isExported) {
          path.insertBefore(t.exportNamedDeclaration(classDeclaration));
        } else {
          path.insertBefore(classDeclaration);
        }
      }

      path.stop();
    })
  );
}

export function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<NewExpression>) => void
): t.Visitor {
  return {
    NewExpression(path) {
      if (!selection.isInsidePath(path)) return;
      onMatch(path);
    }
  };
}
