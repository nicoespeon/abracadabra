import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";
import { Binding } from "@babel/traverse";

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
    createVisitor(selection, (path: t.NodePath<t.VariableDeclarator>) => {
      const { node, parent } = path;

      if (
        isSingleLetVariableDeclaration(parent) &&
        variableCanBeConst(path.scope.bindings, node)
      ) {
        parent.kind = "const";
      }

      path.stop();
    })
  );
}

function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<t.VariableDeclarator>) => void
): t.Visitor {
  return {
    VariableDeclarator(path) {
      const { node } = path;
      if (!selection.isInsideNode(node)) {
        return;
      }
      onMatch(path);
    }
  };
}

function isSingleLetVariableDeclaration(
  node: t.Node
): node is t.VariableDeclaration {
  return t.isLet(node) && node.kind === "let" && node.declarations.length === 1;
}

function variableCanBeConst(
  bindings: { [name: string]: Binding },
  variableDeclarator: t.VariableDeclarator
): boolean {
  for (let name in bindings) {
    let binding = bindings[name];
    if (binding.identifier === variableDeclarator.id && !binding.constant)
      return false;
  }
  return true;
}
