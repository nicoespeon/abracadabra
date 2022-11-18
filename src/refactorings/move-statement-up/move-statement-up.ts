import * as t from "../../ast";
import { Code, Editor, ErrorReason } from "../../editor/editor";
import { Position } from "../../editor/position";
import { Selection } from "../../editor/selection";

export async function moveStatementUp(editor: Editor) {
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
    ObjectExpression: visitPath,
    ObjectProperty: visitPath,
    ObjectMethod: visitPath,
    ClassMethod: visitPath,
    ClassProperty: visitPath,
    ArrayExpression: visitPath,
    Literal: visitPath,
    JSXElement: visitPath,
    JSXAttribute: visitPath,
    JSXExpressionContainer: visitPath
  });

  return { ...result, isFirstStatement, newStatementPosition };

  function visitPath(path: t.NodePath) {
    if (!matchesSelection(path, selection)) return;
    // Since we visit nodes from parent to children, first check
    // if a child would match the selection closer.
    if (hasChildWhichMatchesSelection(path, selection)) return;
    if (typeof path.key !== "number") return;

    if (path.key === 0) {
      isFirstStatement = true;
      return;
    }

    let pathAbove = getSelectablePathAbove(path);

    if (pathAbove?.isJSXText()) {
      if (pathAbove.node.value.trim() === "") {
        pathAbove = getSelectablePathAbove(path, path.key - 1);
      }
    }

    if (!pathAbove) return;

    newStatementPosition = Position.fromAST(
      pathAbove.node.loc.start
    ).putAtSameCharacter(selection.start);

    // If `path` is an object method, recast creates new lines when moved.
    // Adapt the new statement position accordingly.
    if (path.isObjectMethod() && typeof path.key === "number") {
      const extracted = path.getSibling(path.key - 1);

      if (
        pathAbove.isObjectProperty() &&
        !Position.hasSpaceBetweenPaths(path, extracted)
      ) {
        newStatementPosition = newStatementPosition.putAtNextLine();
      }
    }

    if (hasComments(path)) {
      path.node.leadingComments.forEach((comment) => {
        if (!comment.loc) return;
        const { height } = Selection.fromAST(comment.loc);
        newStatementPosition = newStatementPosition.addLines(height + 1);
      });
    }

    if (hasComments(pathAbove)) {
      pathAbove.node.leadingComments.forEach((comment) => {
        if (!comment.loc) return;
        const { height } = Selection.fromAST(comment.loc);
        newStatementPosition = newStatementPosition.removeLines(height + 1);
      });
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

function getSelectablePathAbove(
  path: t.NodePath,
  key: number | string = path.key
): t.SelectablePath | undefined {
  // Not implemented yet
  if (typeof key === "string") return;

  const pathAboveKey = key - 1;
  if (pathAboveKey < 0) return;

  const pathAbove = path.getSibling(pathAboveKey);
  return t.isSelectablePath(pathAbove) ? pathAbove : undefined;
}

function hasComments<T extends t.NodePath>(
  path: T
): path is T & { node: { leadingComments: t.Comment[] } } {
  return !!path.node.leadingComments && path.node.leadingComments.length > 0;
}

function hasChildWhichMatchesSelection(
  path: t.NodePath,
  selection: Selection
): boolean {
  let result = false;

  path.traverse({
    Statement: visitPath,
    ObjectExpression: visitPath,
    ObjectProperty: visitPath,
    ObjectMethod: visitPath,
    ClassMethod: visitPath,
    ClassProperty: visitPath,
    ArrayExpression: visitPath,
    Literal: visitPath,
    JSXElement: visitPath,
    JSXAttribute: visitPath,
    JSXExpressionContainer: visitPath
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

    if (childPath.isObjectExpression() && typeof childPath.key !== "number") {
      return;
    }

    const parentSelection = Selection.fromAST(parent.loc);
    if (childPath.isObjectProperty() && parentSelection.isOneLine) return;

    const childSelection = Selection.fromAST(node.loc);
    if (
      (childPath.isArrayExpression() || childPath.isObjectExpression()) &&
      childSelection.isOneLine
    ) {
      return;
    }

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
