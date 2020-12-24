import { Path } from "./path";

describe("Path", () => {
  it("should trim the extension", () => {
    const path = new Path("../path/to/some-file.ts");

    expect(path.withoutExtension).toBe("../path/to/some-file");
  });

  it("resolves from a relative path", () => {
    const path = new Path("/Users/some/folder/path/to/some-file.ts").relativeTo(
      "/Users/some/folder/another/path/file.ts"
    );

    expect(path.value).toBe("../../path/to/some-file.ts");
  });

  it("resolves to an absolute path", () => {
    const path = new Path("../../path/to/some-file.ts").absoluteFrom(
      "/Users/some/folder/another/path/file.ts"
    );

    expect(path.value).toBe("/Users/some/folder/path/to/some-file.ts");
  });

  it("resolves the correct path after being converted to relative and absolute", () => {
    const filePath = "/Users/some/folder/path/to/some-file.ts";
    const otherFilePath = "/Users/some/folder/another/folder/file.ts";

    const path = new Path(filePath)
      .relativeTo(otherFilePath)
      .absoluteFrom(otherFilePath);

    expect(path.value).toBe(filePath);
  });
});
