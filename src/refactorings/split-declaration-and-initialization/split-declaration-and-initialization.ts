import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export {
  splitDeclarationAndInitialization,
  canSplitDeclarationAndInitialization
};

async function splitDeclarationAndInitialization(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindDeclarationToSplit);
    return;
  }

  await editor.write(updatedCode.code);
}

function canSplitDeclarationAndInitialization(
  ast: t.AST,
  selection: Selection
): boolean {
  let result = false;

  t.traverseAST(ast, {
    VariableDeclaration(path) {
      if (!selection.isInsidePath(path)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      const declarations = path.node.declarations;
      if (!hasInitializedDeclaration(declarations)) return;

      result = true;
    }
  });

  return result;
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(ast, {
    VariableDeclaration(path) {
      if (!selection.isInsidePath(path)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      const declarations = path.node.declarations;
      if (!hasInitializedDeclaration(declarations)) return;

      const kind = path.node.kind === "const" ? "let" : path.node.kind;
      path.replaceWithMultiple([
        t.variableDeclaration(
          kind,
          declarations.map(({ id }) => t.variableDeclarator(id))
        ),
        ...declarations
          .filter(isDeclarationInitialized)
          .map(({ id, init }) =>
            t.expressionStatement(t.assignmentExpression("=", id, init))
          )
      ]);
    }
  });
}

function hasChildWhichMatchesSelection(
  path: t.NodePath,
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
  declarations: t.VariableDeclarator[]
): boolean {
  return declarations.some(isDeclarationInitialized);
}

function isDeclarationInitialized(
  declaration: t.VariableDeclarator
): declaration is t.VariableDeclarator & { init: t.Expression } {
  return declaration.init !== null;
}
