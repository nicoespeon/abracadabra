import { Code, Write } from "../../editor/i-write-code";
import { Selection } from "../../editor/selection";
import { Position } from "../../editor/position";
import {
  ShowErrorMessage,
  ErrorReason
} from "../../editor/i-show-error-message";
import * as ast from "../../ast";

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

  if (!updatedCode.hasCodeChanged) {
    // Don't bother the user with an error message for this.
    if (updatedCode.isFirstStatement) return;

    showErrorMessage(ErrorReason.CantMoveStatementUp);
    return;
  }

  await write(updatedCode.code, updatedCode.newStatementPosition);
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

  const result = ast.transform(code, {
    Statement: visitPath,
    ObjectProperty: visitPath
  });

  return { ...result, isFirstStatement, newStatementPosition };

  function visitPath(path: ast.NodePath) {
    if (!matchesSelection(path, selection)) return;
    // Since we visit nodes from parent to children, first check
    // if a child would match the selection closer.
    if (hasChildWhichMatchesSelection(path, selection)) return;
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

    // Preserve the `loc` of the above path & reset the one of the moved node.
    // Use `path.node` intead of `node` or TS won't build. I don't know why.
    const newNodeAbove = { ...path.node, loc: pathAbove.node.loc };
    const newNode = { ...pathAbove.node, loc: null };
    pathAbove.replaceWith(newNodeAbove);
    path.replaceWith(newNode);
    path.stop();
  }
}

function hasChildWhichMatchesSelection(
  path: ast.NodePath,
  selection: Selection
): boolean {
  let result = false;

  path.traverse({
    Statement: visitPath,
    ObjectProperty: visitPath
  });

  return result;

  function visitPath(childPath: ast.NodePath) {
    /**
     * `if (isValid) {` have 2 statements: `IfStatement` and `BlockStatement`.
     * `BlockStatement` can be a valid statement to move. But here, we would
     * want the `IfStatement` to move.
     *
     * => don't consider a `BlockStatement` that would be a direct child.
     */
    if (isBlockStatementDirectChild(childPath)) return;
    if (!matchesSelection(childPath, selection)) return;

    result = true;
    childPath.stop();
  }

  function isBlockStatementDirectChild(childPath: ast.NodePath): boolean {
    return childPath.parentPath === path && ast.isBlockStatement(childPath);
  }
}

function matchesSelection(path: ast.NodePath, selection: Selection): boolean {
  const { node } = path;
  if (!ast.isSelectableNode(node)) return false;

  const extendedSelection = Selection.fromAST(node.loc)
    .extendToStartOfLine()
    .extendToEndOfLine();
  if (!selection.isInside(extendedSelection)) return false;

  return true;
}
