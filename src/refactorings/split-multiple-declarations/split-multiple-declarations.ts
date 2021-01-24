import { Editor, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { splitMultipleDeclarations, createVisitor };

async function splitMultipleDeclarations(editor: Editor) {
  const { code, selection } = editor;
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindMultipleDeclarationsToSplit);
    return;
  }

  await editor.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path: t.NodePath<t.VariableDeclaration>) => {
      const declarations = path.node.declarations;
      const kind = path.node.kind;

      path.replaceWithMultiple([
        t.variableDeclaration(kind, declarations.slice(0, 1)),
        t.variableDeclaration(kind, declarations.slice(1, 2))
      ]);
    })
  );
}

function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<t.VariableDeclaration>) => void
): t.Visitor {
  return {
    VariableDeclaration(path) {
      selection;

      const declarations = path.node.declarations;
      if (!hasInitializedMultipleDeclarations(declarations)) return;

      onMatch(path);
    }
  };
}

function hasInitializedMultipleDeclarations(
  declarations: t.VariableDeclarator[]
): boolean {
  return declarations.length >= 2;
}
