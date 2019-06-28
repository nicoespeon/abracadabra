import { Code, Write } from "./editor/i-write-code";
import { Selection } from "./editor/selection";
import { ShowErrorMessage, ErrorReason } from "./editor/i-show-error-message";
import * as ast from "./ast";

export { moveStatementDown };

async function moveStatementDown(
  code: Code,
  selection: Selection,
  write: Write,
  showErrorMessage: ShowErrorMessage
) {
  if (selection.isMultiLines) {
    // This should be implemented.
    // But it requires collecting all statements to move down to update the AST.
    showErrorMessage(ErrorReason.CantMoveMultiLinesStatementDown);
    return;
  }

  const updatedCode = updateCode(code, selection);

  if (!updatedCode.hasSelectedNode || !updatedCode.loc) {
    // Don't bother the user with an error message for this.
    if (updatedCode.isLastStatement) return;

    showErrorMessage(ErrorReason.CantMoveStatementDown);
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
): ast.Transformed & { isLastStatement: boolean } {
  let isLastStatement = false;

  const result = ast.transform(code, selectNode => ({
    Statement(path) {
      const { node } = path;
      if (!ast.isSelectableNode(node)) return;
      if (!selection.isInside(Selection.fromAST(node.loc))) return;

      if (typeof path.key !== "number") return;

      const pathBelowKey = path.key + 1;
      const container = new Array().concat(path.container);
      const hasPathBelow = pathBelowKey < container.length;
      if (!hasPathBelow) {
        isLastStatement = true;
        return;
      }

      const pathBelow = path.getSibling(pathBelowKey);
      path.insertBefore({ ...pathBelow.node });
      pathBelow.remove();

      selectNode(path.parent);
    }
  }));

  return { ...result, isLastStatement };
}
