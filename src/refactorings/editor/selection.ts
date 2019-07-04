import { Position } from "./position";
import * as ast from "../ast";
import { Node, NodePath, ASTSelection } from "../ast";

export { Selection };

class Selection {
  private _start: Position;
  private _end: Position;

  constructor([startLine, startChar]: number[], [endLine, endChar]: number[]) {
    this._start = new Position(startLine, startChar);
    this._end = new Position(endLine, endChar);
  }

  static fromPositions(start: Position, end: Position): Selection {
    return new Selection(
      [start.line, start.character],
      [end.line, end.character]
    );
  }

  static fromAST(astSelection: ASTSelection): Selection {
    return Selection.fromPositions(
      Position.fromAST(astSelection.start),
      Position.fromAST(astSelection.end)
    );
  }

  static cursorAt(line: number, char: number): Selection {
    return new Selection([line, char], [line, char]);
  }

  get start(): Position {
    return this._start;
  }

  get end(): Position {
    return this._end;
  }

  get isMultiLines(): boolean {
    return !this.start.isSameLineThan(this.end);
  }

  putCursorAtScopeParentPosition(path: NodePath): Selection {
    const position = this.getScopeParentPosition(path);
    return Selection.fromPositions(position, position);
  }

  extendToStartOfLine(): Selection {
    return Selection.fromPositions(this.start.putAtStartOfLine(), this.end);
  }

  extendToStartOfNextLine(): Selection {
    return Selection.fromPositions(
      this.start,
      this.end.putAtNextLine().putAtStartOfLine()
    );
  }

  extendStartTo(selection: Selection): Selection {
    return selection.end.isBefore(this.start)
      ? Selection.fromPositions(selection.end, this.end)
      : this;
  }

  extendEndTo(selection: Selection): Selection {
    return selection.start.isAfter(this.end)
      ? Selection.fromPositions(this.start, selection.start)
      : this;
  }

  getIndentationLevel(path: NodePath): IndentationLevel {
    return this.getScopeParentPosition(path).character;
  }

  isInside(selection: Selection): boolean {
    return (
      this.start.isAfter(selection.start) && this.end.isBefore(selection.end)
    );
  }

  private getScopeParentPosition(path: NodePath): Position {
    const parent = this.findScopeParent(path);
    if (!parent.loc) return this.start;

    return Position.fromAST(parent.loc.start);
  }

  /**
   * Recursively compare path parents' start position against selection start
   * position to determine which one is at the top-left of selected scope.
   *
   * We consider the last parent to be the scope parent of the selection.
   */
  private findScopeParent(path: NodePath): Node {
    const { parentPath, parent, node } = path;
    if (!parentPath) return node;

    const {
      node: { loc }
    } = parentPath;
    if (!loc) return node;

    const astStart = Position.fromAST(loc.start);
    if (
      !this.start.isSameLineThan(astStart) &&
      // List of node types that would be part of the same scope.
      !ast.isObjectProperty(node) &&
      !ast.isObjectExpression(node) &&
      !ast.isArrayExpression(node) &&
      !ast.isClassProperty(node) &&
      !ast.isClassBody(node) &&
      !ast.isVariableDeclarator(node) &&
      !ast.isLogicalExpression(node) &&
      !ast.isBinaryExpression(node) &&
      !ast.isSwitchCase(node) &&
      !ast.isArrowFunctionExpression(node) &&
      !ast.isUnaryExpression(node) &&
      !ast.isCallExpression(parent) &&
      !ast.isJSXElement(parentPath.node) &&
      !ast.isReturnStatement(parentPath.node) &&
      !ast.isConditionalExpression(parentPath.node) &&
      !ast.isExportNamedDeclaration(parentPath.node)
    ) {
      return node;
    }

    return this.findScopeParent(parentPath);
  }
}

type IndentationLevel = number;
