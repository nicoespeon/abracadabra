import * as vscode from "vscode";
import { Selection } from "../editor/selection";

export type Source = Selection;

export class Highlights {
  private highlights = new Map<
    Source,
    { bindings: Selection[]; decoration: vscode.TextEditorDecorationType }
  >();

  set(
    source: Source,
    bindings: Selection[],
    decoration: vscode.TextEditorDecorationType
  ): void {
    this.highlights.set(source, { bindings, decoration });
  }

  decorationOf(source: Source): vscode.TextEditorDecorationType | undefined {
    return this.highlights.get(source)?.decoration;
  }

  sources(): Source[] {
    return Array.from(this.highlights.keys());
  }

  entries(): [
    Source,
    { bindings: Selection[]; decoration: vscode.TextEditorDecorationType }
  ][] {
    return Array.from(this.highlights.entries());
  }

  delete(source: Source): void {
    this.highlights.delete(source);
  }
}
