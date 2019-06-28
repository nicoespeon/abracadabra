import { Code, Write } from "./editor/i-write-code";
import { Selection } from "./editor/selection";
import { ShowErrorMessage, ErrorReason } from "./editor/i-show-error-message";
import * as ast from "./ast";

export { moveStatementUp };

async function moveStatementUp(
  code: Code,
  selection: Selection,
  write: Write,
  showErrorMessage: ShowErrorMessage
) {
  if (selection.isMultiLines) {
    // This should be implemented.
    // But it requires collecting all statements to move up to update the AST.
    showErrorMessage(ErrorReason.CantMoveMultiLinesStatementUp);
    return;
  }

  const updatedCode = updateCode(code, selection);

  if (!updatedCode.hasSelectedNode || !updatedCode.loc) {
    // Don't bother the user with an error message for this.
    if (updatedCode.isFirstStatement) return;

    showErrorMessage(ErrorReason.CantMoveStatementUp);
    return;
  }

  await write([
    {
      code: updatedCode.code,
      selection: Selection.fromAST(updatedCode.loc)
    }
  ]);
}

function updateCode(
  code: Code,
  selection: Selection
): ast.Transformed & { isFirstStatement: boolean } {
  let isFirstStatement = false;

  const result = ast.transform(code, selectNode => ({
    Statement(path) {
      const { node } = path;
      if (!ast.isSelectableNode(node)) return;
      if (!selection.isInside(Selection.fromAST(node.loc))) return;

      if (typeof path.key !== "number") return;

      const pathAboveKey = path.key - 1;
      if (pathAboveKey < 0) {
        isFirstStatement = true;
        return;
      }

      const pathAbove = path.getSibling(pathAboveKey);
      path.insertAfter({ ...pathAbove.node });
      pathAbove.remove();

      selectNode(path.parent);
    }
  }));

  return { ...result, isFirstStatement };
}
