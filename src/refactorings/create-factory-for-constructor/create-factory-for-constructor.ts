import { Editor, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { createFactoryForConstructor, createVisitor };

async function createFactoryForConstructor(editor: Editor) {
  const { code, selection } = editor;
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindClass);
    return;
  }

  await editor.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path) => {
      const functionDeclaration = t.functionDeclaration(
        t.identifier(`create${path.node.id.name}`),
        [],
        t.blockStatement([t.returnStatement(t.newExpression(path.node.id, []))])
      );
      path.insertAfter(functionDeclaration);
    })
  );
}

function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<t.ClassDeclaration>) => void
): t.Visitor {
  return {
    ClassDeclaration(path) {
      if (!selection.isInsidePath(path)) return;

      onMatch(path);
    }
  };
}
