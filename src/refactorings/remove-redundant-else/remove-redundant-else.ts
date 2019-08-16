import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as ast from "../../ast";
import { last } from "../../array-helpers";

export { removeRedundantElse, hasRedundantElse };

async function removeRedundantElse(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = removeRedundantElseFrom(code, selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFoundRedundantElse);
    return;
  }

  await editor.write(updatedCode.code);
}

function hasRedundantElse(code: Code, selection: Selection): boolean {
  return removeRedundantElseFrom(code, selection).hasCodeChanged;
}

function removeRedundantElseFrom(
  code: Code,
  selection: Selection
): ast.Transformed {
  return ast.transform(code, {
    IfStatement(path) {
      const { node } = path;
      if (!selection.isInsideNode(node)) return;

      const ifBranch = node.consequent;
      if (!ast.isBlockStatement(ifBranch)) return;
      if (!hasExitStatement(ifBranch)) return;

      const elseBranch = node.alternate;
      if (!elseBranch) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      const elseBranchNodes = ast.isBlockStatement(elseBranch)
        ? elseBranch.body
        : [elseBranch];

      node.alternate = null;
      path.replaceWithMultiple([node, ...elseBranchNodes]);
      path.stop();
    }
  });
}

function hasChildWhichMatchesSelection(
  path: ast.NodePath,
  selection: Selection
): boolean {
  let result = false;

  path.traverse({
    IfStatement(childPath) {
      const { node } = childPath;
      if (!selection.isInsidePath(childPath)) return;

      const ifBranch = node.consequent;
      if (!ast.isBlockStatement(ifBranch)) return;
      if (!hasExitStatement(ifBranch)) return;

      const elseBranch = node.alternate;
      if (!elseBranch) return;

      result = true;
      childPath.stop();
    }
  });

  return result;
}

function hasExitStatement(node: ast.BlockStatement): boolean {
  const lastStatement = last(node.body);

  return (
    ast.isReturnStatement(lastStatement) || ast.isThrowStatement(lastStatement)
  );
}
