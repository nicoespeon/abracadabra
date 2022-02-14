import { Editor, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export async function splitMultipleDeclarations(editor: Editor) {
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
      const declarators = path.node.declarations;
      const kind = path.node.kind;

      const declarations = declarators.map(function (declarator) {
        return t.variableDeclaration(kind, [declarator]);
      });

      path.replaceWithMultiple(declarations);
    })
  );
}

export function createVisitor(
  _selection: Selection,
  onMatch: (path: t.NodePath<t.VariableDeclaration>) => void
): t.Visitor {
  return {
    VariableDeclaration(path) {
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
