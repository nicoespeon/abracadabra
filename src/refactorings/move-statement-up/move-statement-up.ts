import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { Position } from "../../editor/position";
import * as ast from "../../ast";

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
): ast.Transformed & {
  isFirstStatement: boolean;
  newStatementPosition: Position;
} {
  let isFirstStatement = false;
  let newStatementPosition = selection.start;

  const result = ast.transform(code, {
    Statement: visitPath,
    ObjectProperty: visitPath,
    ObjectMethod: visitPath,
    ClassMethod: visitPath,
    ClassProperty: visitPath
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

    // If `pathAbove` is a function, it may create new lines when moved.
    // Same if `path` is an object method.
    // Adapt the new statement position accordingly.
    if (
      ast.isFunction(pathAbove) ||
      (ast.isObjectMethod(path) && typeof path.key === "number")
    ) {
      const pathBelowKey = path.key + 1;
      const container = new Array().concat(path.container);
      const hasPathBelow = pathBelowKey < container.length;
      const extracted = path.getSibling(path.key - 1);

      if (hasPathBelow && !Position.hasSpaceBetweenPaths(path, extracted)) {
        newStatementPosition = newStatementPosition.putAtNextLine();
      }

      if (!Position.hasSpaceBetweenPaths(pathAbove, path)) {
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
  path: ast.NodePath,
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

    const { parent } = childPath;
    if (!ast.isSelectableNode(parent)) return;
    const parentSelection = Selection.fromAST(parent.loc);
    if (childPath.isObjectProperty() && parentSelection.isOneLine) {
      return;
    }

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
