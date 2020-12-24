import * as path from "path";

export { Path };

class Path {
  constructor(readonly value: string) {}

  get withoutExtension(): string {
    return this.value.replace(/\.\w+$/, "");
  }

  relativeTo(value: string): Path {
    const relativeValue = path.relative(path.dirname(value), this.value);
    return new Path(relativeValue);
  }

  absoluteFrom(value: string): Path {
    const absoluteValue = path.join(path.dirname(value), this.value);
    return new Path(absoluteValue);
  }
}
