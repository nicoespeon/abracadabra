import { Editor, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { convertLetToConst, createVisitor };

async function convertLetToConst(editor: Editor) {
  const { code, selection } = editor;
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
    createVisitor(selection, (path, parent) => {
      parent.kind = "const";
      path.stop();
    })
  );
}

function createVisitor(
  selection: Selection,
  onMatch: (
    path: t.NodePath<t.VariableDeclarator>,
    parent: t.VariableDeclaration
  ) => void
): t.Visitor {
  return {
    VariableDeclarator(path) {
      const { node, parent } = path;

      if (!selection.isInsideNode(node)) return;
      if (!isSingleLetVariableDeclaration(parent)) return;
      if (!variableCanBeConst(path.scope.bindings, node)) return;

      onMatch(path, parent);
    }
  };
}

function isSingleLetVariableDeclaration(
  node: t.Node
): node is t.VariableDeclaration {
  return t.isLet(node) && node.declarations.length === 1;
}

function variableCanBeConst(
  bindings: { [name: string]: t.Binding },
  variableDeclarator: t.VariableDeclarator
): boolean {
  for (let name in bindings) {
    let binding = bindings[name];
    if (binding.identifier === variableDeclarator.id && !binding.constant) {
      return false;
    }
  }

  return true;
}
