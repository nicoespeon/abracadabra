import { Highlights, Source } from "./highlights";

type FilePath = string;

export class HighlightsRepository {
  private highlightsPerFile = new Map<FilePath, Highlights>();
  private static instance: HighlightsRepository | null = null;

  private constructor() {}

  // These should usually persist across all editor instances.
  static get(): HighlightsRepository {
    if (!this.instance) {
      this.instance = new HighlightsRepository();
    }

    return this.instance;
  }

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

  removeHighlightsOfFile(source: Source, filePath: FilePath): void {
    const existingHighlights = this.highlightsPerFile.get(filePath);
    if (!existingHighlights) return;

    const decoration = existingHighlights.decorationOf(source);
    if (!decoration) return;

    decoration.dispose();
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
