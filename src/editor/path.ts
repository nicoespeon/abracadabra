import * as path from "path";

export { Path, AbsolutePath, RelativePath };

class Path {
  constructor(readonly value: string) {}

  equals(otherValue: string): boolean {
    return this.value === otherValue;
  }

  get withoutExtension(): string {
    return this.value.replace(/\.\w+$/, "");
  }

  protected get isValueAbsolute(): boolean {
    return this.value.startsWith(path.sep);
  }
}

class AbsolutePath extends Path {
  constructor(value: string) {
    super(value);

    if (!this.isValueAbsolute) {
      throw new Error(`${value} is not an absolute path`);
    }
  }

  relativeTo(value: string): RelativePath {
    const relativeValue = path.relative(path.dirname(value), this.value);
    return new RelativePath(relativeValue);
  }
}

class RelativePath extends Path {
  constructor(value: string) {
    super(value);

    if (this.isValueAbsolute) {
      throw new Error(`${value} is not a relative path`);
    }
  }

  absoluteFrom(value: string): AbsolutePath {
    const absoluteValue = path.join(path.dirname(value), this.value);
    return new AbsolutePath(absoluteValue);
  }
}
