import { Code, Write } from "../../editor/i-write-code";
import { Selection } from "../../editor/selection";
import {
  ShowErrorMessage,
  ErrorReason
} from "../../editor/i-show-error-message";
import * as ast from "../../ast";

export {
  splitDeclarationAndInitialization,
  canSplitDeclarationAndInitialization
};

async function splitDeclarationAndInitialization(
  code: Code,
  selection: Selection,
  write: Write,
  showErrorMessage: ShowErrorMessage
) {
  const updatedCode = updateCode(code, selection);

  if (!updatedCode.hasCodeChanged) {
    showErrorMessage(ErrorReason.DidNotFoundDeclarationToSplit);
    return;
  }

  await write(updatedCode.code);
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

      const declarations = path.node.declarations;
      if (!allDeclarationsAreInitialized(declarations)) return;

      path.replaceWithMultiple([
        ast.variableDeclaration(
          "let",
          declarations.map(({ id }) => ast.variableDeclarator(id))
        ),
        ...declarations.map(({ id, init }) =>
          ast.expressionStatement(ast.assignmentExpression("=", id, init))
        )
      ]);
    }
  });
}

function allDeclarationsAreInitialized(
  declarations: ast.VariableDeclarator[]
): declarations is (ast.VariableDeclarator & { init: ast.Expression })[] {
  return declarations.every(({ init }) => init !== null);
}
