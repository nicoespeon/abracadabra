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
    createVisitor(selection, (path: t.NodePath<t.VariableDeclaration>) => {
      const { node } = path;
      let canBeConverted = true;

      if (!t.isLet(node)) {
        canBeConverted = false;
      } else {
        const variableBindings: VariableBinding[] = bindingsForSelectedVariableDeclarators(
          path.scope.bindings,
          node
        );

        variableBindings.forEach(binding => {
          if (!binding.isConstant) {
            canBeConverted = false;
          }
        });
      }

      if (canBeConverted) {
        node.kind = "const";
      }

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
type VariableBinding = {
  identifier: babel.types.Identifier;
  isConstant: boolean;
};
function bindingsForSelectedVariableDeclarators(
  bindings: { [name: string]: Binding },
  node: t.VariableDeclaration
): VariableBinding[] {
  const variableBindings: VariableBinding[] = [];
  for (let name in bindings) {
    let binding = bindings[name];
    node.declarations
      .filter(declarator => declarator.id === binding.identifier)
      .forEach(_ =>
        variableBindings.push({
          identifier: binding.identifier,
          isConstant: binding.constant
        })
      );
  }
  return variableBindings;
}
