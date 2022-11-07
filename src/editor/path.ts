import * as _path from "path";
const path = _path.posix;

export class Path {
  constructor(protected _value: string) {}

  get value(): string {
    return this._value.trim();
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
    return this.value.replace(/[^/]*$/, "");
  }

  protected get isValueAbsolute(): boolean {
    // Don't use `path.sep` because VS Code may be using `/` even on Windows
    return this.value.startsWith("/") || this.value.startsWith("\\");
  }

  relativeTo(otherPath: Path): RelativePath;
  relativeTo(value: string): RelativePath;
  relativeTo(pathOrValue: Path | string): RelativePath {
    const value =
      typeof pathOrValue === "string" ? pathOrValue : pathOrValue.value;

    const relativeValue = path.relative(path.dirname(value), this.value);
    return new RelativePath(relativeValue);
  }

  absoluteFrom(value: string): AbsolutePath {
    return new AbsolutePath(value);
  }
}

export class AbsolutePath extends Path {
  constructor(value: string) {
    super(value);

    if (!this.isValueAbsolute) {
      throw new Error(`${value} is not an absolute path`);
    }
  }

  absoluteFrom(_value: string): AbsolutePath {
    return this;
  }
}

export class RelativePath extends Path {
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
