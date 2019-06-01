export class Position {
  private _line: number;
  private _character: number;

  constructor(line: number, character: number) {
    this._line = line;
    this._character = character;
  }

  static fromAST(astPosition: { line: number; column: number }): Position {
    return new Position(astPosition.line - 1, astPosition.column);
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
}
