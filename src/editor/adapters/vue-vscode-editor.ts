import * as vscode from "vscode";

import { Code } from "../editor";
import { Selection } from "../selection";
import { VSCodeEditor } from "./vscode-editor";

export { VueVSCodeEditor };

class VueVSCodeEditor extends VSCodeEditor {
  get code(): Code {
    return super.code.slice(this.openingTagOffset, this.closingTagOffset);
  }

  get selection(): Selection {
    const offsetLinesCount = this.toOffsetLinesCount(this.openingTagOffset);

    return Selection.fromPositions(
      super.selection.start.removeLines(offsetLinesCount),
      super.selection.end.removeLines(offsetLinesCount)
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

  private toOffsetLinesCount(offset: Offset): number {
    return super.code.slice(0, offset).split("\n").length - 1;
  }

  private get openingTagOffset(): Offset {
    return super.code.indexOf(this.openingTag) + this.openingTag.length;
  }

  private get openingTag(): string {
    return "<script>";
  }

  private get closingTagOffset(): Offset {
    return super.code.indexOf("</script>");
  }

  // TODO: replace code in script tags when we write
  // async readThenWrite(
  //   selection: Selection,
  //   getModifications: (code: Code) => Modification[],
  //   newCursorPosition?: Position
  // ): Promise<void>

  // TODO: offset selection accordingly
  // moveCursorTo(position: Position)
}

type Offset = number;
