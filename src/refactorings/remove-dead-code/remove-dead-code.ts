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
      if (!selection.isInsidePath(path)) return;

      const { test } = path.node;

      if (ast.isFalsy(test)) {
        replaceWithAlternate(path);
        path.stop();
        return;
      }

      if (ast.isTruthy(test)) {
        replaceWithConsequent(path);
        path.stop();
        return;
      }

      path.traverse({
        IfStatement(childPath) {
          const { test: childTest } = childPath.node;

          if (ast.areOpposite(test, childTest)) {
            replaceWithAlternate(childPath);
            return;
          }

          if (ast.areEqual(test, childTest)) {
            replaceWithConsequent(childPath);
            return;
          }
        }
      });
    }
  });
}

function replaceWithAlternate(path: ast.NodePath<ast.IfStatement>) {
  const { alternate } = path.node;
  alternate ? ast.replaceWithBodyOf(path, alternate) : path.remove();
}

function replaceWithConsequent(path: ast.NodePath<ast.IfStatement>) {
  ast.replaceWithBodyOf(path, path.node.consequent);
}
