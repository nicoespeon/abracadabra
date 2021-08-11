import * as vscode from "vscode";

import { Code, Command, Modification, Result } from "../editor";
import { Position } from "../position";
import { Selection } from "../selection";
import { VSCodeEditor } from "./vscode-editor";

export { VueVSCodeEditor };

class VueVSCodeEditor extends VSCodeEditor {
  get code(): Code {
    return super.code.slice(this.openingTagOffset, this.closingTagOffset);
  }

  get selection(): Selection {
    return this.offsetEditorSelection(super.selection);
  }

  async delegate(command: Command) {
    if (command === Command.RenameSymbol) {
      return Result.NotSupported;
    }

    return super.delegate(command);
  }

  async write(code: Code, newCursorPosition?: Position): Promise<void> {
    return super.write(
      code,
      newCursorPosition && this.offsetPosition(newCursorPosition)
    );
  }

  protected get editRange(): vscode.Range {
    return new vscode.Range(
      new vscode.Position(
        this.toOffsetLinesCount(this.openingTagOffset),
        this.openingTag.length
      ),
      new vscode.Position(this.toOffsetLinesCount(this.closingTagOffset), 0)
    );
  }

  async readThenWrite(
    selection: Selection,
    getModifications: (code: Code) => Modification[],
    newCursorPosition?: Position
  ): Promise<void> {
    const getOffsetModifications = (code: Code) => {
      return getModifications(code).map(({ code, selection }) => ({
        code,
        selection: this.offsetSelection(selection)
      }));
    };

    return super.readThenWrite(
      this.offsetSelection(selection),
      getOffsetModifications,
      newCursorPosition && this.offsetPosition(newCursorPosition)
    );
  }

  moveCursorTo(position: Position) {
    return super.moveCursorTo(this.offsetPosition(position));
  }

  private offsetEditorSelection(selection: Selection): Selection {
    const offsetLinesCount = this.toOffsetLinesCount(this.openingTagOffset);

    return Selection.fromPositions(
      selection.start.removeLines(offsetLinesCount),
      selection.end.removeLines(offsetLinesCount)
    );
  }

  private offsetSelection(selection: Selection): Selection {
    const offsetLinesCount = this.toOffsetLinesCount(this.openingTagOffset);

    return Selection.fromPositions(
      selection.start.addLines(offsetLinesCount),
      selection.end.addLines(offsetLinesCount)
    );
  }

  private offsetPosition(position: Position): Position {
    return position.addLines(this.toOffsetLinesCount(this.openingTagOffset));
  }

  private toOffsetLinesCount(offset: Offset): number {
    return super.code.slice(0, offset).split("\n").length - 1;
  }

  private get openingTagOffset(): Offset {
    return super.code.indexOf(this.openingTag) + this.openingTag.length;
  }

  private get openingTag(): string {
    const matches = super.code.match(/<script(\s|\w|=|"|')*>/m);
    if (!matches) return "<script>";

    return matches[0];
  }

  private get closingTagOffset(): Offset {
    return super.code.indexOf("</script>");
  }
}

type Offset = number;
