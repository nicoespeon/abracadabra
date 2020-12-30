import * as path from "path";

export { Path, AbsolutePath, RelativePath };

class Path {
  constructor(protected _value: string) {}

  get value(): string {
    return this._value;
  }

  equals(otherValue: string): boolean {
    return this.value === otherValue;
  }

  get withoutExtension(): string {
    return this.value.replace(/\.\w+$/, "");
  }

  get fileName(): string {
    return path.basename(this.value);
  }

  get withoutFileName(): string {
    return path.dirname(this.value) + path.sep;
  }

  protected get isValueAbsolute(): boolean {
    return this.value.startsWith(path.sep);
  }

  relativeTo(otherPath: Path): RelativePath;
  relativeTo(value: string): RelativePath;
  relativeTo(pathOrValue: Path | string): RelativePath {
    const value =
      typeof pathOrValue === "string" ? pathOrValue : pathOrValue.value;

    const relativeValue = path.relative(path.dirname(value), this.value);
    return new RelativePath(relativeValue);
  }
}

class AbsolutePath extends Path {
  constructor(value: string) {
    super(value);

    if (!this.isValueAbsolute) {
      throw new Error(`${value} is not an absolute path`);
    }
  }
}

class RelativePath extends Path {
  constructor(value: string) {
    super(value);

    if (this.isValueAbsolute) {
      throw new Error(`${value} is not a relative path`);
    }

    if (!this._value.startsWith(".")) {
      this._value = `.${path.sep}${this._value}`;
    }
  }

  absoluteFrom(value: string): AbsolutePath {
    const absoluteValue = path.join(path.dirname(value), this.value);
    return new AbsolutePath(absoluteValue);
  }
}
