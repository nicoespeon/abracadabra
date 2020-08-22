import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { Position } from "../../editor/position";
import * as t from "../../ast";

export { moveStatementDown };

async function moveStatementDown(editor: Editor) {
  const { code, selection } = editor;
  if (selection.isMultiLines) {
    // This should be implemented.
    // But it requires collecting all statements to move down to update the AST.
    editor.showError(ErrorReason.CantMoveMultiLinesStatementDown);
    return;
  }

  const updatedCode = updateCode(code, selection);

  if (!updatedCode.hasCodeChanged) {
    // Don't bother the user with an error message for this.
    if (updatedCode.isLastStatement) return;

    editor.showError(ErrorReason.CantMoveStatementDown);
    return;
  }

  await editor.write(updatedCode.code, updatedCode.newStatementPosition);
}

function updateCode(
  code: Code,
  selection: Selection
): t.Transformed & {
  isLastStatement: boolean;
  newStatementPosition: Position;
} {
  let isLastStatement = false;
  let newStatementPosition = selection.start;

  const result = t.transform(code, {
    Statement: visitPath,
    ObjectProperty: visitPath,
    ObjectMethod: visitPath,
    ClassMethod: visitPath,
    ClassProperty: visitPath
  });

  return { ...result, isLastStatement, newStatementPosition };

  function visitPath(path: t.NodePath) {
    if (!matchesSelection(path, selection)) return;
    // Since we visit nodes from parent to children, first check
    // if a child would match the selection closer.
    if (hasChildWhichMatchesSelection(path, selection)) return;
    if (typeof path.key !== "number") return;

    const pathBelowKey = path.key + 1;
    const container = new Array().concat(path.container);
    const hasPathBelow = pathBelowKey < container.length;
    if (!hasPathBelow) {
      isLastStatement = true;
      return;
    }

    const pathBelow = path.getSibling(pathBelowKey);
    if (!t.isSelectableNode(pathBelow.node)) return;
    if (!t.isSelectableNode(path.node)) return;

    const nodeSelection = Selection.fromAST(path.node.loc);
    const nodeBelowSelection = Selection.fromAST(pathBelow.node.loc);
    const nextStatementHeight = nodeBelowSelection.height + 1;
    const blankLinesBetweenNodes =
      nodeBelowSelection.start.line - nodeSelection.end.line - 1;

    newStatementPosition = selection.start.addLines(
      nextStatementHeight + blankLinesBetweenNodes
    );

    // If `pathBelow` is a function, it may create new lines when moved.
    // Same if `path` is an object method.
    // Adapt the new statement position accordingly.
    if (
      t.isFunction(pathBelow) ||
      (t.isObjectMethod(path) && typeof path.key === "number")
    ) {
      const hasPathAbove = path.key > 0;
      const extracted = path.getSibling(path.key - 1);

      if (hasPathAbove && !Position.hasSpaceBetweenPaths(extracted, path)) {
        newStatementPosition = newStatementPosition.putAtNextLine();
      }

      if (!Position.hasSpaceBetweenPaths(path, pathBelow)) {
        newStatementPosition = newStatementPosition.putAtNextLine();
      }
    }

    // Preserve the `loc` of the below path & reset the one of the moved node.
    // Use `path.node` intead of `node` or TS won't build. I don't know why.
    const newNodeBelow = { ...path.node, loc: pathBelow.node.loc };
    const newNode = { ...pathBelow.node, loc: null };
    pathBelow.replaceWith(newNodeBelow);
    path.replaceWith(newNode);
    path.stop();
  }
}

function hasChildWhichMatchesSelection(
  path: t.NodePath,
  selection: Selection
): boolean {
  let result = false;

  path.traverse({
    Statement: visitPath,
    ObjectProperty: visitPath,
    ObjectMethod: visitPath,
    ClassMethod: visitPath,
    ClassProperty: visitPath
  });

  return result;

  function visitPath(childPath: t.NodePath) {
    /**
     * `if (isValid) {` have 2 statements: `IfStatement` and `BlockStatement`.
     * `BlockStatement` can be a valid statement to move. But here, we would
     * want the `IfStatement` to move.
     *
     * => don't consider a `BlockStatement` that would be a direct child.
     */
    if (isBlockStatementDirectChild(childPath)) return;
    if (!matchesSelection(childPath, selection)) return;

    const { parent } = childPath;
    if (!t.isSelectableNode(parent)) return;
    const parentSelection = Selection.fromAST(parent.loc);
    if (childPath.isObjectProperty() && parentSelection.isOneLine) return;

    result = true;
    childPath.stop();
  }

  function isBlockStatementDirectChild(childPath: t.NodePath): boolean {
    return childPath.parentPath === path && t.isBlockStatement(childPath);
  }
}

function matchesSelection(path: t.NodePath, selection: Selection): boolean {
  const { node } = path;
  if (!t.isSelectableNode(node)) return false;

  const extendedSelection = Selection.fromAST(node.loc)
    .extendToStartOfLine()
    .extendToEndOfLine();
  if (!selection.isInside(extendedSelection)) return false;

  return true;
}
