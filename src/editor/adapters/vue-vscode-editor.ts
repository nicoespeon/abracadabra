import * as vscode from "vscode";

import { Code } from "../editor";
import { Selection } from "../selection";
import { VSCodeEditor } from "./vscode-editor";

export { VueVSCodeEditor };

class VueVSCodeEditor extends VSCodeEditor {
  get code(): Code {
    return super.code.slice(
      this.openingScriptTagOffset,
      this.closingScriptTagOffset
    );
  }

  get selection(): Selection {
    const offsetCodeLines = super.code
      .slice(0, this.openingScriptTagOffset)
      .split("\n");
    const offsetLinesCount = offsetCodeLines.length - 1;

    return Selection.fromPositions(
      super.selection.start.removeLines(offsetLinesCount),
      super.selection.end.removeLines(offsetLinesCount)
    );
  }

  private get openingScriptTagOffset(): Offset {
    return super.code.indexOf("<script>") + "<script>".length;
  }

  private get closingScriptTagOffset(): Offset {
    return super.code.indexOf("</script>");
  }

  protected get editRange(): vscode.Range {
    const offsetCodeLines = super.code
      .slice(0, this.openingScriptTagOffset)
      .split("\n");
    const offsetLinesCount = offsetCodeLines.length - 1;

    const offsetCodeLines2 = super.code
      .slice(0, this.closingScriptTagOffset)
      .split("\n");
    const offsetLinesCount2 = offsetCodeLines2.length - 1;

    return new vscode.Range(
      new vscode.Position(offsetLinesCount, "<script>".length),
      new vscode.Position(offsetLinesCount2, 0)
    );
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
