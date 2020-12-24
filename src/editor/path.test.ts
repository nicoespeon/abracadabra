import { Path, AbsolutePath, RelativePath } from "./path";

describe("Path", () => {
  it("should trim the extension", () => {
    const path = new Path("../path/to/some-file.ts");

    expect(path.withoutExtension).toBe("../path/to/some-file");
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

  it("throw if given path is relative", () => {
    expect(() => new AbsolutePath("../some/file.ts")).toThrow();
  });
});

describe("RelativePath", () => {
  it("convert to an absolute path", () => {
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
});
