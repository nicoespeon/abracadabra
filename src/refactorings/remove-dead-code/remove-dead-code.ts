import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as ast from "../../ast";

export { removeDeadCode, hasDeadCode };

async function removeDeadCode(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(code, selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFoundDeadCode);
    return;
  }

  await editor.write(updatedCode.code);
}

function hasDeadCode(code: Code, selection: Selection): boolean {
  return updateCode(code, selection).hasCodeChanged;
}

function updateCode(code: Code, selection: Selection): ast.Transformed {
  return ast.transform(code, {
    IfStatement(path) {
      if (ast.areEqual(path.node.test, ast.booleanLiteral(false))) {
        path.remove();
        return;
      }

      if (ast.areEqual(path.node.test, ast.booleanLiteral(true))) {
        path.replaceWithMultiple(ast.getStatements(path.node.consequent));
        return;
      }
    }
  });
}
