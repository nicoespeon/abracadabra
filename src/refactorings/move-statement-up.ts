import { Code, Write } from "./editor/i-write-code";
import { Selection } from "./editor/selection";
import { Position } from "./editor/position";
import { ShowErrorMessage, ErrorReason } from "./editor/i-show-error-message";
import { PutCursorAt } from "./editor/i-put-cursor-at";
import * as ast from "./ast";

export { moveStatementUp };

async function moveStatementUp(
  code: Code,
  selection: Selection,
  write: Write,
  showErrorMessage: ShowErrorMessage,
  putCursorAt: PutCursorAt
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

  await putCursorAt(updatedCode.newStatementPosition);
}

function updateCode(
  code: Code,
  selection: Selection
): ast.Transformed & {
  isFirstStatement: boolean;
  newStatementPosition: Position;
} {
  let isFirstStatement = false;
  let newStatementPosition = selection.start;

  const result = ast.transform(code, selectNode => ({
    Statement(path) {
      const { node } = path;
      if (!ast.isSelectableNode(node)) return;

      const extendedSelection = Selection.fromAST(
        node.loc
      ).extendToStartOfLine();
      if (!selection.isInside(extendedSelection)) return;

      if (typeof path.key !== "number") return;

      const pathAboveKey = path.key - 1;
      if (pathAboveKey < 0) {
        isFirstStatement = true;
        return;
      }

      const pathAbove = path.getSibling(pathAboveKey);
      if (!ast.isSelectableNode(pathAbove.node)) return;

      newStatementPosition = Position.fromAST(
        pathAbove.node.loc.start
      ).putAtSameCharacter(selection.start);
      path.insertAfter({ ...pathAbove.node });
      pathAbove.remove();

      selectNode(path.parent);
    }
  }));

  return { ...result, isFirstStatement, newStatementPosition };
}
