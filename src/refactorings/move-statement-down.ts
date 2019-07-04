import { Code, Write } from "./editor/i-write-code";
import { Selection } from "./editor/selection";
import { Position } from "./editor/position";
import { ShowErrorMessage, ErrorReason } from "./editor/i-show-error-message";
import { PutCursorAt } from "./editor/i-put-cursor-at";
import * as ast from "./ast";

export { moveStatementDown };

async function moveStatementDown(
  code: Code,
  selection: Selection,
  write: Write,
  showErrorMessage: ShowErrorMessage,
  putCursorAt: PutCursorAt
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

  await putCursorAt(updatedCode.newStatementPosition);
}

function updateCode(
  code: Code,
  selection: Selection
): ast.Transformed & {
  isLastStatement: boolean;
  newStatementPosition: Position;
} {
  let isLastStatement = false;
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

      const pathBelowKey = path.key + 1;
      const container = new Array().concat(path.container);
      const hasPathBelow = pathBelowKey < container.length;
      if (!hasPathBelow) {
        isLastStatement = true;
        return;
      }

      const pathBelow = path.getSibling(pathBelowKey);
      if (!ast.isSelectableNode(pathBelow.node)) return;

      newStatementPosition = Position.fromAST(
        pathBelow.node.loc.start
      ).putAtSameCharacter(selection.start);

      // Preserve the `loc` of the below path & reset the one of the moved node.
      const newNodeBelow = { ...path.node, loc: pathBelow.node.loc };
      const newNode = { ...pathBelow.node, loc: null };
      pathBelow.replaceWith(newNodeBelow);
      path.replaceWith(newNode);

      selectNode(path.parent);
    }
  }));

  return { ...result, isLastStatement, newStatementPosition };
}
