import { Code, Write } from "./i-write-code";
import { Selection } from "./selection";
import * as ast from "./ast";
import { ShowErrorMessage, ErrorReason } from "./i-show-error-message";

export { removeRedundantElse };

async function removeRedundantElse(
  code: Code,
  selection: Selection,
  write: Write,
  showErrorMessage: ShowErrorMessage
) {
  const updatedCode = removeElseFrom(code, selection);

  if (!updatedCode || !updatedCode.loc) {
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

function removeElseFrom(
  code: Code,
  selection: Selection
): ast.Transformed | undefined {
  return ast.transform(code, replaceWith => ({
    IfStatement(path) {
      if (!ast.isSelectableNode(path.node)) return;
      if (!selection.isInside(Selection.fromAST(path.node.loc))) return;

      const ifBranch = path.node.consequent;
      if (!ast.isBlockStatement(ifBranch)) return;
      if (!hasExitStatement(ifBranch)) return;

      const elseBranch = path.node.alternate;
      if (!elseBranch) return;
      if (!ast.isBlockStatement(elseBranch)) return;

      path.node.alternate = null;
      path.replaceWithMultiple([path.node, ...elseBranch.body]);

      replaceWith(path.parentPath.node);
    }
  }));
}

function hasExitStatement(node: ast.BlockStatement): boolean {
  const lastStatement = node.body[node.body.length - 1];

  return (
    ast.isReturnStatement(lastStatement) || ast.isThrowStatement(lastStatement)
  );
}
