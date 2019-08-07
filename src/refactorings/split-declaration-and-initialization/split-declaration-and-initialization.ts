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
    VariableDeclarator(path) {
      const variableDeclarationPath = path.parentPath;
      if (!selection.isInsidePath(variableDeclarationPath)) return;
      if (!path.node.init) return;

      variableDeclarationPath.replaceWithMultiple([
        ast.variableDeclaration("let", [ast.variableDeclarator(path.node.id)]),
        ast.expressionStatement(
          ast.assignmentExpression("=", path.node.id, path.node.init)
        )
      ]);
    }
  });
}
