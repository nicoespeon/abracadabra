import { Code, Write } from "./i-write-code";
import { Selection } from "./selection";
import * as ast from "./ast";
import { ShowErrorMessage, ErrorReason } from "./i-show-error-message";

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
      if (!ast.isSelectableNode(path.node)) return;
      if (!selection.isInside(Selection.fromAST(path.node.loc))) return;

      const ifBranch = path.node.consequent;
      if (!ast.isBlockStatement(ifBranch)) return;
      if (!hasExitStatement(ifBranch)) return;

      const elseBranch = path.node.alternate;
      if (!elseBranch) return;

      const elseBranchNodes = ast.isBlockStatement(elseBranch)
        ? elseBranch.body
        : [elseBranch];

      path.node.alternate = null;
      path.replaceWithMultiple([path.node, ...elseBranchNodes]);
      path.stop();

      selectNode(path.parentPath.node);
    }
  }));
}

function hasExitStatement(node: ast.BlockStatement): boolean {
  const lastStatement = node.body[node.body.length - 1];

  return (
    ast.isReturnStatement(lastStatement) || ast.isThrowStatement(lastStatement)
  );
}
