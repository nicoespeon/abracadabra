import * as t from "../../ast";
import { Code } from "../../editor/editor";
import { Position } from "../../editor/position";
import { Selection } from "../../editor/selection";
import { COMMANDS, EditorCommand, RefactoringState } from "../../refactorings";

export function moveStatementUp(state: RefactoringState): EditorCommand {
  const { code, selection } = state;

  if (selection.isMultiLines) {
    // This should be implemented.
    // But it requires collecting all statements to move up to update the AST.
    return COMMANDS.showErrorICant("move up a multi-lines selection yet");
  }

  const result = findStatement(code, selection);

  if (result.status === "not found") {
    return COMMANDS.showErrorICant("move this statement up");
  }

  if (result.status === "first statement") {
    return COMMANDS.doNothing();
  }

  const newLinesCountBetweenStatements =
    result.selection.start.line - result.previousStatementSelection.end.line;

  const areOnSameLine = result.selection.isSameLineThan(
    result.previousStatementSelection
  );

  return COMMANDS.readThenWrite(
    result.selection,
    (code) => {
      const shouldSwapTrailingComma =
        result.shouldSwapTrailingComma && !code.endsWith(",");

      const indentation =
        newLinesCountBetweenStatements > 0
          ? "\n".repeat(newLinesCountBetweenStatements) + result.indentation
          : areOnSameLine
            ? " "
            : "";

      const insertSelectedStatementAbove = {
        code: code + (shouldSwapTrailingComma ? "," : "") + indentation,
        selection: Selection.cursorAtPosition(
          result.previousStatementSelection.start
        )
      };

      const statementToRemoveSelection =
        newLinesCountBetweenStatements > 0
          ? Selection.fromPositions(
              result.selection.start
                .removeLines(newLinesCountBetweenStatements)
                .putAtEndOfLine(),
              result.selection.end
            )
          : areOnSameLine
            ? Selection.fromPositions(
                result.selection.start,
                result.selection.end.addCharacters(1)
              )
            : Selection.fromPositions(
                result.selection.start,
                result.selection.end
              );
      const removeSelectedStatementFromBelow = {
        code: "",
        selection: statementToRemoveSelection
      };

      const maybeRemoveTrailingComma = shouldSwapTrailingComma
        ? [
            {
              code: "",
              selection: Selection.fromPositions(
                result.previousStatementSelection.end,
                result.previousStatementSelection.end.addCharacters(1)
              )
            }
          ]
        : [];

      return [
        insertSelectedStatementAbove,
        removeSelectedStatementFromBelow
      ].concat(maybeRemoveTrailingComma);
    },
    areOnSameLine
      ? result.previousStatementSelection.start
      : result.newCursorPosition
  );
}

function findStatement(code: Code, selection: Selection) {
  let result = { status: "not found" } as
    | {
        status: "found";
        selection: Selection;
        previousStatementSelection: Selection;
        indentation: string;
        shouldSwapTrailingComma: boolean;
        newCursorPosition: Position;
      }
    | { status: "not found" }
    | { status: "first statement" };

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
    if (!t.isSelectableNode(path.node)) return;
    // Since we visit nodes from parent to children, first check
    // if a child would match the selection closer.
    if (hasChildWhichMatchesSelection(path, selection)) return;
    if (typeof path.key !== "number") return;
    if (!path.container) return;

    if (path.key === 0) {
      result = { status: "first statement" };
      return;
    }

    let pathAbove = getSelectablePathAbove(path);
    if (pathAbove?.isJSXText()) {
      if (pathAbove.node.value.trim() === "") {
        pathAbove = getSelectablePathAbove(path, path.key - 1);
      }
    }
    if (!pathAbove) return;

    const container = ([] as t.Node[]).concat(path.container);
    const isLastStatement = path.key >= container.length - 1;
    const nodeSelection = Selection.fromAST(path.node.loc);
    const isOnSameLineThanParent =
      t.isSelectableNode(path.parent) &&
      Selection.fromAST(path.parent.loc).end.line <= nodeSelection.end.line;
    const pathBelow = path.getSibling(path.key + 1);
    const isOnSameLineThanPathBelow =
      t.isSelectableNode(pathBelow.node) &&
      Selection.fromAST(pathBelow.node.loc).start.line <=
        nodeSelection.end.line;
    const canExtendSelectionToEndOfLine =
      !isOnSameLineThanParent && !isOnSameLineThanPathBelow;

    const statementSelectionWithoutComments = canExtendSelectionToEndOfLine
      ? Selection.fromPositions(
          nodeSelection.start,
          nodeSelection.end
        ).extendToEndOfLine()
      : Selection.fromPositions(nodeSelection.start, nodeSelection.end);
    const statementSelection = maybeExtendSelectionToComment(
      path,
      statementSelectionWithoutComments
    );

    const indentationLevel = statementSelection.start.character;
    const indentationChar = t.isUsingTabs(pathAbove.node) ? "\t" : " ";
    const indentation = indentationChar.repeat(indentationLevel);

    result = {
      status: "found",
      previousStatementSelection: maybeExtendSelectionToComment(
        pathAbove,
        Selection.fromAST(pathAbove.node.loc)
      ),
      selection: statementSelection,
      indentation,
      shouldSwapTrailingComma:
        (t.isObjectProperty(path.node) ||
          t.isObjectMethod(path.node) ||
          t.isObjectExpression(path.node)) &&
        isLastStatement,
      newCursorPosition: Position.fromAST(pathAbove.node.loc.start)
        .putAtSameCharacter(selection.start)
        .addLines(commentsHeight(path, statementSelectionWithoutComments))
    };
    path.stop();
  }
}

function commentsHeight(path: t.NodePath, selection: Selection): number {
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

function getSelectablePathAbove(
  path: t.NodePath,
  key: number | string | null = path.key
): t.SelectablePath | undefined {
  // Not implemented yet
  if (typeof key === "string") return;
  if (key === null) return;

  const pathAboveKey = key - 1;
  if (pathAboveKey < 0) return;

  const pathAbove = path.getSibling(pathAboveKey);
  return t.isSelectablePath(pathAbove) ? pathAbove : undefined;
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
