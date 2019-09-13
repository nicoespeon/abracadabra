import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as ast from "../../ast";

export {
  splitDeclarationAndInitialization,
  canSplitDeclarationAndInitialization
};

async function splitDeclarationAndInitialization(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(code, selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFoundDeclarationToSplit);
    return;
  }

  await editor.write(updatedCode.code);
}

function canSplitDeclarationAndInitialization(
  code: Code,
  selection: Selection
): boolean {
  return updateCode(code, selection).hasCodeChanged;
}

function updateCode(code: Code, selection: Selection): ast.Transformed {
  return ast.transform(code, {
    VariableDeclaration(path) {
      if (!selection.isInsidePath(path)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      const declarations = path.node.declarations;
      if (!hasInitializedDeclaration(declarations)) return;

      const kind = path.node.kind === "const" ? "let" : path.node.kind;
      path.replaceWithMultiple([
        ast.variableDeclaration(
          kind,
          declarations.map(({ id }) => ast.variableDeclarator(id))
        ),
        ...declarations
          .filter(isDeclarationInitialized)
          .map(({ id, init }) =>
            ast.expressionStatement(ast.assignmentExpression("=", id, init))
          )
      ]);
    }
  });
}

function hasChildWhichMatchesSelection(
  path: ast.NodePath,
  selection: Selection
): boolean {
  let result = false;

  path.traverse({
    VariableDeclaration(childPath) {
      if (!selection.isInsidePath(childPath)) return;

      result = true;
      childPath.stop();
    }
  });

  return result;
}

function hasInitializedDeclaration(
  declarations: ast.VariableDeclarator[]
): boolean {
  return declarations.some(isDeclarationInitialized);
}

function isDeclarationInitialized(
  declaration: ast.VariableDeclarator
): declaration is ast.VariableDeclarator & { init: ast.Expression } {
  return declaration.init !== null;
}
