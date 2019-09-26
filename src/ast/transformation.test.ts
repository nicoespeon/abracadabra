import { transform } from "./transformation";

describe("Transformation", () => {
  describe("transform", () => {
    it("should not consider code changed with Windows EOL", () => {
      const code = "console.log('Hello Windows')\r\n";

      const { hasCodeChanged } = transform(code, {});

      expect(hasCodeChanged).toBe(false);
    });

    it("should not consider code changed with Unix EOL", () => {
      const code = "console.log('Hello UNIX')\n";

      const { hasCodeChanged } = transform(code, {});

      expect(hasCodeChanged).toBe(false);
    });
  });
});
