import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { convertLetToConst, createVisitor };

async function convertLetToConst(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindLetToConvertToConst);
    return;
  }

  await editor.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path: t.NodePath<t.VariableDeclaration>) => {
      const { node } = path;
      node.kind = "const";
      path.stop();
    })
  );
}

function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<t.VariableDeclaration>) => void
): t.Visitor {
  return {
    VariableDeclaration(path) {
      const { node } = path;
      selection.isInsideNode(node);
      onMatch(path);
    }
  };
}
