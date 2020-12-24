import { Path } from "./path";

describe("Path", () => {
  it("should trim the extension", () => {
    const path = new Path("../path/to/some-file.ts");

    expect(path.withoutExtension).toBe("../path/to/some-file");
  });
});
