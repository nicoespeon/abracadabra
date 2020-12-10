import { Editor, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { moveToExistingFile, createVisitor };

async function moveToExistingFile(editor: Editor) {
  const { code, selection } = editor;

  // TODO: Ask user to select other existing file to move to
  // TODO: Get list of files in the workspace (can take from VSCode?)
  // TODO: Let user select one based on input search (can leverage VSCode behavior?)
  const relativePath = "./other-file";
  const updatedCode = updateCode(t.parse(code), selection, relativePath);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindCodeToMove);
    return;
  }

  // TODO: Write code in other file
  // TODO: Export code from other file

  await editor.write(updatedCode.code);
}

function updateCode(
  ast: t.AST,
  selection: Selection,
  relativePath: string
): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path, importIdentifier, programPath) => {
      const importStatement = t.importDeclaration(
        [t.importSpecifier(importIdentifier, importIdentifier)],
        t.stringLiteral(relativePath)
      );

      programPath.node.body.unshift(importStatement);
      path.remove();
    })
  );
}

function createVisitor(
  selection: Selection,
  onMatch: (
    path: t.NodePath<t.FunctionDeclaration>,
    importIdentifier: t.Identifier,
    program: t.NodePath<t.Program>
  ) => void
): t.Visitor {
  return {
    FunctionDeclaration(path) {
      if (!path.parentPath.isProgram()) return;
      if (!path.node.id) return;
      if (!selection.isInsidePath(path)) return;

      onMatch(path, path.node.id, path.parentPath);
    }
  };
}
