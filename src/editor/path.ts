import * as path from "path";

export { Path, AbsolutePath, RelativePath };

class Path {
  constructor(readonly value: string) {}

  get withoutExtension(): string {
    return this.value.replace(/\.\w+$/, "");
  }
}

class AbsolutePath extends Path {
  constructor(value: string) {
    // TODO: implement invariant
    super(value);
  }

  relativeTo(value: string): RelativePath {
    const relativeValue = path.relative(path.dirname(value), this.value);
    return new RelativePath(relativeValue);
  }
}

class RelativePath extends Path {
  constructor(value: string) {
    // TODO: implement invariant
    super(value);
  }

  absoluteFrom(value: string): AbsolutePath {
    const absoluteValue = path.join(path.dirname(value), this.value);
    return new AbsolutePath(absoluteValue);
  }
}
