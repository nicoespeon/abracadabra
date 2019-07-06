import { Code, Write } from "./editor/i-write-code";
import { Selection } from "./editor/selection";
import { ShowErrorMessage, ErrorReason } from "./editor/i-show-error-message";
import * as ast from "./ast";

export { removeRedundantElse, hasRedundantElse };

async function removeRedundantElse(
  code: Code,
  selection: Selection,
  write: Write,
  showErrorMessage: ShowErrorMessage
) {
  const updatedCode = removeRedundantElseFrom(code, selection);

  if (!updatedCode.hasSelectedNode || !updatedCode.loc) {
    showErrorMessage(ErrorReason.DidNotFoundRedundantElse);
    return;
  }

  await write([
    {
      code: updatedCode.code,
      selection: Selection.fromAST(updatedCode.loc)
    }
  ]);
}

function hasRedundantElse(code: Code, selection: Selection): boolean {
  return removeRedundantElseFrom(code, selection).hasSelectedNode;
}

function removeRedundantElseFrom(
  code: Code,
  selection: Selection
): ast.Transformed {
  return ast.transform(code, selectNode => ({
    IfStatement(path) {
      const { node, parent } = path;
      if (!ast.isSelectableNode(node)) return;
      if (!selection.isInside(Selection.fromAST(node.loc))) return;

      const ifBranch = node.consequent;
      if (!ast.isBlockStatement(ifBranch)) return;
      if (!hasExitStatement(ifBranch)) return;

      const elseBranch = node.alternate;
      if (!elseBranch) return;

      const elseBranchNodes = ast.isBlockStatement(elseBranch)
        ? elseBranch.body
        : [elseBranch];

      node.alternate = null;
      path.replaceWithMultiple([node, ...elseBranchNodes]);
      path.stop();

      selectNode(parent);
    }
  }));
}

function hasExitStatement(node: ast.BlockStatement): boolean {
  const lastStatement = node.body[node.body.length - 1];

  return (
    ast.isReturnStatement(lastStatement) || ast.isThrowStatement(lastStatement)
  );
}
