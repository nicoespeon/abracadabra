import { Path, AbsolutePath, RelativePath } from "./path";

describe("Path", () => {
  it("should trim the extension", () => {
    const path = new Path("../path/to/some-file.ts");

    expect(path.withoutExtension).toBe("../path/to/some-file");
  });

  it("should trim the path", () => {
    const path = new Path("../path/to/some-file.ts");

    expect(path.fileName).toBe("some-file.ts");
  });

  it("should trim the file name", () => {
    const path = new Path("../path/to/some-file.ts");

    expect(path.withoutFileName).toBe("../path/to/");
  });

  it("detects when it points to the same file", () => {
    const filePath = "/Users/some/folder/file.ts";

    expect(new Path(filePath).equals(filePath)).toBe(true);
  });
});

describe("AbsolutePath", () => {
  it("converts to a relative path", () => {
    const absolutePath = new AbsolutePath(
      "/Users/some/folder/path/to/some-file.ts"
    );

    const path = absolutePath.relativeTo(
      "/Users/some/folder/another/path/file.ts"
    );

    expect(path).toStrictEqual(new RelativePath("../../path/to/some-file.ts"));
  });

  it("converts to a relative path and back to an absolute one", () => {
    const filePath = "/Users/some/folder/path/to/some-file.ts";
    const otherFilePath = "/Users/some/folder/another/folder/file.ts";

    const path = new AbsolutePath(filePath)
      .relativeTo(otherFilePath)
      .absoluteFrom(otherFilePath);

    expect(path).toStrictEqual(new AbsolutePath(filePath));
  });

  it("throws if given path is relative", () => {
    expect(() => new AbsolutePath("../some/file.ts")).toThrow();
  });

  it("trims given paths", () => {
    expect(() => new AbsolutePath(" /d:/WEB/blom/main2.js")).not.toThrow();
  });
});

describe("RelativePath", () => {
  it("prefixes with current folder", () => {
    const path = new RelativePath("another/file.ts");

    expect(path.value).toBe("./another/file.ts");
  });

  it("converts to an absolute path", () => {
    const relativePath = new RelativePath("../../path/to/some-file.ts");

    const path = relativePath.absoluteFrom(
      "/Users/some/folder/another/path/file.ts"
    );

    expect(path).toStrictEqual(
      new AbsolutePath("/Users/some/folder/path/to/some-file.ts")
    );
  });

  it("throw if given path is absolute", () => {
    expect(() => new RelativePath("/Users/some/file.ts")).toThrow();
  });

  it("resolves relative path from another one", () => {
    const originalPath = new RelativePath("../constants.ts");
    const newPath = new RelativePath("./nested/file.ts");

    const result = originalPath.relativeTo(newPath);

    expect(result).toStrictEqual(new RelativePath("../../constants.ts"));
  });
});
