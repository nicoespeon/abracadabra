import { last } from "../array";
import { ASTPosition, isSelectableNode, NodePath } from "../ast";
import { Code } from "./editor";

export class Position {
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

  isStrictlyBefore(position: Position): boolean {
    return this.isBefore(position) && !this.isEqualTo(position);
  }

  isStrictlyAfter(position: Position): boolean {
    return this.isAfter(position) && !this.isEqualTo(position);
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

  removeCharacters(characters: number): Position {
    return new Position(this.line, this.character - characters);
  }

  putAtSameCharacter(position: Position): Position {
    return new Position(this.line, position.character);
  }

  goToNextNthWordInCode(wordsCount: number, code: Code): Position {
    const LINES_SEPARATOR = "\n";
    const WORDS_SEPARATOR = " ";
    // To improve perfs, limit how many lines we process.
    // Hypothesis: 10 lines per word to find should be enough.
    const maxLinesToAnalyze = wordsCount * 10;

    const symbolsToAnalyze = code
      .split(LINES_SEPARATOR)
      .slice(this.line, this.line + maxLinesToAnalyze)
      .flatMap((line, lineIndex) => {
        return line
          .split(WORDS_SEPARATOR)
          .reduce<ParsedSymbol[]>((memo, text, charIndex) => {
            const previousValueEnd = last(memo)?.end || 0;
            const start = previousValueEnd + charIndex * WORDS_SEPARATOR.length;

            return memo.concat({
              isWord: text !== "",
              line: lineIndex,
              start,
              end: start + text.length
            });
          }, []);
      });

    const matchingWord = this.findMatchingWord(symbolsToAnalyze, wordsCount);
    if (!matchingWord) return this;

    return new Position(this.line + matchingWord.line, matchingWord.start);
  }

  private findMatchingWord(
    symbols: ParsedSymbol[],
    wordsToMatch: number
  ): ParsedSymbol | undefined {
    let matchCount = 0;
    for (const symbol of symbols) {
      if (!symbol.isWord) continue;

      matchCount++;
      if (matchCount !== wordsToMatch) continue;

      return symbol;
    }

    return;
  }
}

interface ParsedSymbol {
  isWord: boolean;
  line: number;
  start: number;
  end: number;
}
