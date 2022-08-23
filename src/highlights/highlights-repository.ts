import { Selection } from "../editor/selection";
import { Decoration, Highlights, Source } from "./highlights";

type FilePath = string;

export class HighlightsRepository {
  private highlightsPerFile = new Map<FilePath, Highlights>();
  private nextDecoration: Decoration = 0;

  get(filePath: FilePath): Highlights | undefined {
    return this.highlightsPerFile.get(filePath);
  }

  set(filePath: FilePath, highlights: Highlights): void {
    this.highlightsPerFile.set(filePath, highlights);
  }

  delete(filePath: FilePath): void {
    this.highlightsPerFile.delete(filePath);
  }

  entries(): [FilePath, Highlights][] {
    return Array.from(this.highlightsPerFile.entries());
  }

  decorationOf(source: Source, filePath: FilePath): Decoration | undefined {
    const existingHighlights = this.highlightsPerFile.get(filePath);
    if (!existingHighlights) return;

    return existingHighlights.decorationOf(source);
  }

  allDecorations(): Decoration[] {
    return this.entries().flatMap(([, highlights]) =>
      highlights.entries().map(([, { decoration }]) => decoration)
    );
  }

  save(filePath: FilePath, source: Source, bindings: Selection[]): Decoration {
    const decoration = this.nextDecoration;
    const existingHighlights = this.get(filePath) ?? new Highlights();
    existingHighlights.set(source, bindings, decoration);
    this.set(filePath, existingHighlights);

    this.nextDecoration++;

    return decoration;
  }

  removeHighlightsOfFile(source: Source, filePath: FilePath): void {
    const existingHighlights = this.highlightsPerFile.get(filePath);
    if (!existingHighlights) return;

    existingHighlights.delete(source);
    this.highlightsPerFile.set(filePath, existingHighlights);
  }

  removeAllHighlights(): void {
    this.entries().forEach(([filePath, highlights]) =>
      highlights
        .sources()
        .forEach((source) => this.removeHighlightsOfFile(source, filePath))
    );
  }
}
