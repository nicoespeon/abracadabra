import * as t from "../../ast";
import { Code } from "../../editor/editor";
import { Position } from "../../editor/position";
import { Selection } from "../../editor/selection";
import { COMMANDS, EditorCommand, RefactoringState } from "../../refactorings";

export function moveStatementDown(state: RefactoringState): EditorCommand {
  const { code, selection } = state;

  if (selection.isMultiLines) {
    // This should be implemented.
    // But it requires collecting all statements to move down to update the AST.
    return COMMANDS.showErrorICant("move up a multi-lines selection yet");
  }

  const updatedCode = updateCode(code, selection);

  if (!updatedCode.hasCodeChanged) {
    // Don't bother the user with an error message for this.
    if (updatedCode.isLastStatement) return COMMANDS.doNothing();

    return COMMANDS.showErrorICant("move this statement down");
  }

  return COMMANDS.write(updatedCode.code, updatedCode.newStatementPosition);
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

  return { ...result, isLastStatement, newStatementPosition };

  function visitPath(path: t.NodePath) {
    if (!matchesSelection(path, selection)) return;
    // Since we visit nodes from parent to children, first check
    // if a child would match the selection closer.
    if (hasChildWhichMatchesSelection(path, selection)) return;
    if (typeof path.key !== "number") return;
    if (!path.container) return;

    const container = ([] as object[]).concat(path.container);
    if (path.key >= container.length - 1) {
      isLastStatement = true;
      return;
    }

    if (!t.isSelectableNode(path.node)) return;

    let pathBelow = getSelectablePathBelow(path);

    if (pathBelow?.isJSXText()) {
      if (pathBelow.node.value.trim() === "") {
        pathBelow = getSelectablePathBelow(path, path.key + 1);
      }
    }

    if (!pathBelow) return;

    const nodeSelection = Selection.fromAST(path.node.loc);
    const nodeBelowSelection = Selection.fromAST(pathBelow.node.loc);
    const nextStatementHeight = nodeBelowSelection.height + 1;
    const blankLinesBetweenNodes =
      nodeBelowSelection.start.line - nodeSelection.end.line - 1;

    newStatementPosition = selection.start.addLines(
      nextStatementHeight + blankLinesBetweenNodes
    );

    // If `pathBelow` is a function, recast creates new lines when moved.
    // Adapt the new statement position accordingly.
    if (pathBelow.isFunction()) {
      const hasPathAbove = path.key > 0;
      const extracted = path.getSibling(path.key - 1);

      if (hasPathAbove && !Position.hasSpaceBetweenPaths(extracted, path)) {
        newStatementPosition = newStatementPosition.putAtNextLine();
      }

      if (
        !path.isClassMethod() &&
        !path.isObjectMethod() &&
        !Position.hasSpaceBetweenPaths(path, pathBelow)
      ) {
        newStatementPosition = newStatementPosition.putAtNextLine();
      }
    }

    // Same if `path` is an object method.
    if (path.isObjectMethod() && typeof path.key === "number") {
      const extracted = path.getSibling(path.key - 1);

      if (
        // @ts-expect-error Not sure why it doesn't compile
        pathBelow.isObjectProperty() &&
        !Position.hasSpaceBetweenPaths(path, extracted)
      ) {
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

function getSelectablePathBelow(
  path: t.NodePath,
  key: number | string | null = path.key
): t.SelectablePath | undefined {
  // Not implemented yet
  if (typeof key === "string") return;
  if (key === null) return;
  if (!path.container) return;

  const pathBelowKey = key + 1;
  const container = ([] as object[]).concat(path.container);
  const hasPathBelow = pathBelowKey < container.length;
  if (!hasPathBelow) {
    return;
  }

  const pathBelow = path.getSibling(pathBelowKey);
  return t.isSelectablePath(pathBelow) ? pathBelow : undefined;
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
