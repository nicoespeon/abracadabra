import * as t from "../../ast";
import { Code } from "../../editor/editor";
import { Position } from "../../editor/position";
import { Selection } from "../../editor/selection";
import { COMMANDS, EditorCommand, RefactoringState } from "../../refactorings";

export type Result =
  | {
      status: "found";
      aboveStatementSelection: Selection;
      belowStatementSelection: Selection;
      indentation: string;
      shouldSwapTrailingComma: boolean;
      newCursorPosition: Position;
    }
  | { status: "not found" }
  | { status: "out-of-bound statement" };

export function moveStatement(
  state: RefactoringState,
  onVisitMatch: (path: t.SelectablePath, selection: Selection) => Result
): EditorCommand {
  const { code, selection } = state;

  if (selection.isMultiLines) {
    // This should be implemented.
    return COMMANDS.showErrorICant("move a multi-lines selection yet");
  }

  const result = findStatement(code, selection, onVisitMatch);

  if (result.status === "not found") {
    return COMMANDS.showErrorICant("move this statement");
  }

  if (result.status === "out-of-bound statement") {
    return COMMANDS.doNothing();
  }

  return COMMANDS.readThenWrite(
    result.belowStatementSelection,
    (code) => {
      const shouldSwapTrailingComma =
        result.shouldSwapTrailingComma && !code.endsWith(",");

      const newLinesBetweenStatementsCount =
        result.belowStatementSelection.start.line -
        result.aboveStatementSelection.end.line;

      const insertStatementAbove = {
        code: code + (shouldSwapTrailingComma ? "," : "") + result.indentation,
        selection: Selection.cursorAtPosition(
          result.aboveStatementSelection.start
        )
      };

      const removeOriginalStatement = {
        code: "",
        selection: Selection.fromPositions(
          result.belowStatementSelection.start
            .removeLines(newLinesBetweenStatementsCount)
            .putAtEndOfLine(),
          result.belowStatementSelection.end
        )
      };

      const removeTrailingComma = {
        code: "",
        selection: Selection.fromPositions(
          result.aboveStatementSelection.end,
          result.aboveStatementSelection.end.addCharacters(1)
        )
      };

      return shouldSwapTrailingComma
        ? [insertStatementAbove, removeOriginalStatement, removeTrailingComma]
        : [insertStatementAbove, removeOriginalStatement];
    },
    result.newCursorPosition
  );
}

function findStatement(
  code: Code,
  selection: Selection,
  onVisitMatch: (path: t.SelectablePath, selection: Selection) => Result
) {
  let result = { status: "not found" } as Result;

  t.parseAndTraverseCode(code, {
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

  function visitPath(path: t.NodePath) {
    if (!matchesSelection(path, selection)) return;
    if (!t.isSelectablePath(path)) return;
    // Since we visit nodes from parent to children, first check
    // if a child would match the selection closer.
    if (hasChildWhichMatchesSelection(path, selection)) return;

    result = onVisitMatch(path, selection);
    if (result.status !== "not found") {
      path.stop();
    }
  }
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

    if (
      childPath.parentPath?.isObjectExpression() &&
      childPath.parentPath.node.properties.length <= 1
    ) {
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
  const { node, parent } = path;
  if (!t.isSelectableNode(node)) return false;

  const extendedSelection =
    t.isSelectableNode(parent) && !Selection.fromAST(parent.loc).isOneLine
      ? Selection.fromAST(node.loc).extendToStartOfLine().extendToEndOfLine()
      : Selection.fromAST(node.loc);
  if (!selection.isInside(extendedSelection)) return false;

  return true;
}

export function getSelectablePathAbove(
  path: t.NodePath,
  key: number | string | null = path.key
): t.SelectablePath | undefined {
  // Not implemented yet
  if (typeof key === "string") return;
  if (key === null) return;

  const pathAboveKey = key - 1;
  if (pathAboveKey < 0) return;

  const pathAbove = path.getSibling(pathAboveKey);
  if (!t.isSelectablePath(pathAbove)) return;

  return pathAbove.isJSXText() && pathAbove.node.value.trim() === ""
    ? getSelectablePathAbove(pathAbove, pathAboveKey)
    : pathAbove;
}

export function getSelectablePathBelow(
  path: t.NodePath,
  key: number | string | null = path.key
): t.SelectablePath | undefined {
  // Not implemented yet
  if (typeof key === "string") return;
  if (key === null) return;
  if (!path.container) return;

  const pathBelowKey = key + 1;
  const container = ([] as t.Node[]).concat(path.container);
  const hasPathBelow = pathBelowKey < container.length;
  if (!hasPathBelow) {
    return;
  }

  const pathBelow = path.getSibling(pathBelowKey);
  if (!t.isSelectablePath(pathBelow)) return;

  return pathBelow.isJSXText() && pathBelow.node.value.trim() === ""
    ? getSelectablePathBelow(pathBelow, pathBelowKey)
    : pathBelow;
}

export function attemptToMovePathStatementUp(path: t.SelectablePath<t.Node>) {
  if (typeof path.key !== "number") return;
  if (!path.container) return;

  if (path.key === 0) {
    return "first statement" as const;
  }

  const pathAbove = getSelectablePathAbove(path);
  if (!pathAbove) return;

  const aboveStatementNoCommentSelection = Selection.fromAST(
    pathAbove.node.loc
  );
  const aboveStatementSelection = maybeExtendSelectionToComment(
    pathAbove,
    aboveStatementNoCommentSelection
  );
  const belowStatementNoCommentSelection = Selection.fromAST(path.node.loc);
  const belowStatementSelection = maybeExtendSelectionToComment(
    path,
    belowStatementNoCommentSelection
  ).extendToEndOfLine();

  const newLinesBetweenStatementsCount =
    belowStatementSelection.start.line - aboveStatementSelection.end.line;
  const indentationLevel = belowStatementNoCommentSelection.start.character;
  const indentationChar = t.isUsingTabs(pathAbove.node) ? "\t" : " ";
  const indentation =
    "\n".repeat(newLinesBetweenStatementsCount) +
    indentationChar.repeat(indentationLevel);

  const container = ([] as t.Node[]).concat(path.container);
  const isLastStatement = path.key >= container.length - 1;

  return {
    aboveStatementSelection,
    belowStatementSelection,
    indentation,
    shouldSwapTrailingComma:
      (t.isObjectProperty(path.node) ||
        t.isObjectMethod(path.node) ||
        t.isObjectExpression(path.node)) &&
      isLastStatement
  };
}

export function commentsHeight(path: t.NodePath, selection: Selection): number {
  const firstCommentLoc = getNodeFirstCommentLoc(path);
  if (!firstCommentLoc) return 0;

  const height =
    selection.start.line - Position.fromAST(firstCommentLoc.start).line - 1;
  return Math.max(height, 0);
}

function maybeExtendSelectionToComment(
  path: t.NodePath<t.Node>,
  selection: Selection
): Selection {
  const firstCommentLoc = getNodeFirstCommentLoc(path);

  return firstCommentLoc
    ? selection.extendStartToStartOf(Selection.fromAST(firstCommentLoc))
    : selection;
}

function getNodeFirstCommentLoc(path: t.NodePath<t.Node>) {
  const commentLocs = path.node.leadingComments?.map((node) => node.loc) ?? [];
  return commentLocs[0];
}
