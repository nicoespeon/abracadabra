import { Code, Write } from "../../editor/i-write-code";
import { Selection } from "../../editor/selection";
import {
  ShowErrorMessage,
  ErrorReason
} from "../../editor/i-show-error-message";
import * as ast from "../../ast";

export { inlineFunction };

async function inlineFunction(
  code: Code,
  selection: Selection,
  write: Write,
  showErrorMessage: ShowErrorMessage
) {
  const updatedCode = updateCode(code, selection);

  if (!updatedCode.hasCodeChanged) {
    showErrorMessage(ErrorReason.DidNotFoundInlinableCode);
    return;
  }

  await write(updatedCode.code);
}

function updateCode(code: Code, selection: Selection): ast.Transformed {
  return ast.transform(code, {
    FunctionDeclaration(path) {
      if (!ast.isSelectableNode(path.node)) return;
      if (!selection.isInside(Selection.fromAST(path.node.loc))) return;

      replaceAllIdentifiersInScope(path.parentPath, path.node);
      path.remove();
    }
  });
}
function replaceAllIdentifiersInScope(
  scopePath: ast.NodePath,
  functionDeclaration: ast.FunctionDeclaration
) {
  scopePath.traverse({
    CallExpression(path) {
      const identifier = path.node.callee;
      if (!ast.isIdentifier(identifier)) return;
      if (!functionDeclaration.id) return;
      if (identifier.name !== functionDeclaration.id.name) return;

      path.replaceWith(functionDeclaration.body);
    }
  });
}
