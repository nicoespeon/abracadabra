import { ASTPosition, NodePath, isSelectableNode } from "../ast";

export { Position };

class Position {
  private _line: number;
  private _character: number;

  constructor(line: number, character: number) {
    this._line = line;
    this._character = character;
  }

  static fromAST(astPosition: ASTPosition): Position {
    return new Position(astPosition.line - 1, astPosition.column);
  }

  static hasSpaceBetweenPaths(pathA: NodePath, pathB: NodePath): boolean {
    if (!isSelectableNode(pathA.node)) return false;
    if (!isSelectableNode(pathB.node)) return false;

    const startPositionA = Position.fromAST(pathA.node.loc.end);
    const endPositionB = Position.fromAST(pathB.node.loc.start);

    return endPositionB.line - startPositionA.line > 1;
  }

  get line(): number {
    return this._line;
  }

  get character(): number {
    return this._character;
  }

  isEqualTo(position: Position): boolean {
    return (
      this.isSameLineThan(position) && this.character === position.character
    );
  }

  isSameLineThan(position: Position): boolean {
    return this.line === position.line;
  }

  isBefore(position: Position): boolean {
    return (
      this.isEqualTo(position) ||
      this.line < position.line ||
      (this.isSameLineThan(position) && this.character < position.character)
    );
  }

  isAfter(position: Position): boolean {
    return this.isEqualTo(position) || !this.isBefore(position);
  }

  putAtStartOfLine(): Position {
    return new Position(this.line, 0);
  }

  putAtEndOfLine(): Position {
    // We don't know the exact character of end of line.
    // Use a very large number for editor to cap at end of line.
    return new Position(this.line, 999999999);
  }

  putAtNextLine(): Position {
    return new Position(this.line + 1, this.character);
  }

  addLines(lines: number): Position {
    return new Position(this.line + lines, this.character);
  }

  removeLines(lines: number): Position {
    return new Position(this.line - lines, this.character);
  }

  addCharacters(characters: number): Position {
    return new Position(this.line, this.character + characters);
  }

  putAtSameCharacter(position: Position): Position {
    return new Position(this.line, position.character);
  }
}
