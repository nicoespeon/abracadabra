import { Selection } from "../editor/selection";
import { SourceChange } from "../editor/source-change";
import { Decoration, Highlights, Source } from "./highlights";

type FilePath = string;

export class HighlightsRepository {
  private highlightsPerFile = new Map<FilePath, Highlights>();
  private nextDecoration: Decoration = 0;

  entries(): [FilePath, Highlights][] {
    return Array.from(this.highlightsPerFile.entries());
  }

  get(filePath: FilePath): Highlights | undefined {
    return this.highlightsPerFile.get(filePath);
  }

  getAllDecorations(filePath: FilePath): Map<Selection, Decoration> {
    return (
      this.get(filePath)?.allDecorations ?? new Map<Selection, Decoration>()
    );
  }

  findHighlightsSource(
    filePath: FilePath,
    selection: Selection
  ): Source | undefined {
    const existingHighlights = this.get(filePath);
    if (!existingHighlights) return;

    return existingHighlights.entries().find(([source, { bindings }]) => {
      const selections = [source, ...bindings];
      return selections.some((s) => selection.isInside(s));
    })?.[0];
  }

  decorationOf(filePath: FilePath, source: Source): Decoration | undefined {
    const existingHighlights = this.highlightsPerFile.get(filePath);
    if (!existingHighlights) return;

    return existingHighlights.decorationOf(source);
  }

  bindingsOf(filePath: FilePath, source: Source): Selection[] {
    const existingHighlights = this.highlightsPerFile.get(filePath);
    if (!existingHighlights) return [];

    return existingHighlights.bindingsOf(source);
  }

  set(filePath: FilePath, highlights: Highlights): void {
    this.highlightsPerFile.set(filePath, highlights);
  }

  saveAndIncrement(
    filePath: FilePath,
    source: Source,
    bindings: Selection[]
  ): Decoration {
    const decoration = this.nextDecoration;
    const existingHighlights = this.get(filePath) ?? new Highlights();
    existingHighlights.set(source, bindings, decoration);
    this.set(filePath, existingHighlights);

    this.nextDecoration++;

    return decoration;
  }

  removeHighlightsOfFile(filePath: FilePath, source: Source): void {
    const existingHighlights = this.highlightsPerFile.get(filePath);
    if (!existingHighlights) return;

    existingHighlights.delete(source);
    this.highlightsPerFile.set(filePath, existingHighlights);
  }

  removeAllHighlightsOfFile(filePath: FilePath): void {
    this.highlightsPerFile.delete(filePath);
  }

  removeAllHighlights(): void {
    this.entries().forEach(([filePath, highlights]) =>
      highlights
        .sources()
        .forEach((source) => this.removeHighlightsOfFile(filePath, source))
    );
  }

  repositionHighlights(filePath: FilePath, change: SourceChange): void {
    const existingHighlights = this.highlightsPerFile.get(filePath);
    if (!existingHighlights) return;

    const newHighlights = new Highlights();
    const highlightsEntries = existingHighlights.entries();
    for (const [source, { bindings, decoration }] of highlightsEntries) {
      if (change.modifies(source)) continue;

      newHighlights.set(
        change.applyToSelection(source),
        bindings
          .filter((b) => !change.modifies(b))
          .map((b) => change.applyToSelection(b)),
        decoration
      );
    }
    this.highlightsPerFile.set(filePath, newHighlights);
  }
}
