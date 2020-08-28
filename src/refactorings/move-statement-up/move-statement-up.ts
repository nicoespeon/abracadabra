import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { Position } from "../../editor/position";
import * as t from "../../ast";

export { moveStatementUp };

async function moveStatementUp(editor: Editor) {
  const { code, selection } = editor;
  if (selection.isMultiLines) {
    // This should be implemented.
    // But it requires collecting all statements to move up to update the AST.
    editor.showError(ErrorReason.CantMoveMultiLinesStatementUp);
    return;
  }

  const updatedCode = updateCode(code, selection);

  if (!updatedCode.hasCodeChanged) {
    // Don't bother the user with an error message for this.
    if (updatedCode.isFirstStatement) return;

    editor.showError(ErrorReason.CantMoveStatementUp);
    return;
  }

  await editor.write(updatedCode.code, updatedCode.newStatementPosition);
}

function updateCode(
  code: Code,
  selection: Selection
): t.Transformed & {
  isFirstStatement: boolean;
  newStatementPosition: Position;
} {
  let isFirstStatement = false;
  let newStatementPosition = selection.start;

  const result = t.transform(code, {
    Statement: visitPath,
    ObjectProperty: visitPath,
    ObjectMethod: visitPath,
    ClassMethod: visitPath,
    ClassProperty: visitPath,
    ArrayExpression: visitPath,
    Literal: visitPath
  });

  return { ...result, isFirstStatement, newStatementPosition };

  function visitPath(path: t.NodePath) {
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
    if (!t.isSelectableNode(pathAbove.node)) return;

    newStatementPosition = Position.fromAST(
      pathAbove.node.loc.start
    ).putAtSameCharacter(selection.start);

    // If `pathAbove` is a function, recast creates new lines when moved.
    // Same if `path` is an object method.
    // Adapt the new statement position accordingly.
    if (
      t.isFunction(pathAbove) ||
      (t.isObjectMethod(path) && typeof path.key === "number")
    ) {
      const pathBelowKey = path.key + 1;
      const container = new Array().concat(path.container);
      const hasPathBelow = pathBelowKey < container.length;
      const extracted = path.getSibling(path.key - 1);

      if (hasPathBelow && !Position.hasSpaceBetweenPaths(path, extracted)) {
        newStatementPosition = newStatementPosition.putAtNextLine();
      }

      if (
        path.isObjectMethod() &&
        pathAbove.isObjectProperty() &&
        !Position.hasSpaceBetweenPaths(path, extracted)
      ) {
        newStatementPosition = newStatementPosition.putAtNextLine();
      }

      if (
        !path.isClassMethod() &&
        !path.isObjectMethod() &&
        !Position.hasSpaceBetweenPaths(pathAbove, path)
      ) {
        newStatementPosition = newStatementPosition.putAtNextLine();
      }
    }

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
  path: t.NodePath,
  selection: Selection
): boolean {
  let result = false;

  path.traverse({
    Statement: visitPath,
    ObjectProperty: visitPath,
    ObjectMethod: visitPath,
    ClassMethod: visitPath,
    ClassProperty: visitPath,
    ArrayExpression: visitPath,
    Literal: visitPath
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

    const { parent, node } = childPath;
    if (!t.isSelectableNode(parent)) return;
    if (!t.isSelectableNode(node)) return;

    const parentSelection = Selection.fromAST(parent.loc);
    if (childPath.isObjectProperty() && parentSelection.isOneLine) return;

    const childSelection = Selection.fromAST(node.loc);
    if (childPath.isArrayExpression() && childSelection.isOneLine) return;

    if (childPath.isLiteral() && !path.isArrayExpression()) return;

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
