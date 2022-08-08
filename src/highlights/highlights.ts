import { Selection } from "../editor/selection";

export type Source = Selection;
export type Decoration = number;

export class Highlights {
  private highlights = new Map<
    Source,
    { bindings: Selection[]; decoration: Decoration }
  >();

  set(source: Source, bindings: Selection[], decoration: Decoration): void {
    this.highlights.set(source, { bindings, decoration });
  }

  decorationOf(source: Source): Decoration | undefined {
    return this.highlights.get(source)?.decoration;
  }

  sources(): Source[] {
    return Array.from(this.highlights.keys());
  }

  entries(): [Source, { bindings: Selection[]; decoration: Decoration }][] {
    return Array.from(this.highlights.entries());
  }

  delete(source: Source): void {
    this.highlights.delete(source);
  }
}
