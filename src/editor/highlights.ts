import * as vscode from "vscode";
import { Selection } from "./selection";

export class Highlights {
  private highlights = new Map<Selection[], vscode.TextEditorDecorationType>();

  set(
    selections: Selection[],
    decoration: vscode.TextEditorDecorationType
  ): void {
    this.highlights.set(selections, decoration);
  }

  get(selections: Selection[]): vscode.TextEditorDecorationType | undefined {
    return this.highlights.get(selections);
  }

  keys(): Selection[][] {
    return Array.from(this.highlights.keys());
  }

  entries(): [Selection[], vscode.TextEditorDecorationType][] {
    return Array.from(this.highlights.entries());
  }

  delete(selections: Selection[]): void {
    this.highlights.delete(selections);
  }
}
