import { transform } from "./transformation";

describe("transformation", () => {
  describe("transform", () => {
    it("should deal with windows eol style", () => {
      const code = "console.log('hello windows')\n";
      expect(transform(code, {}).hasCodeChanged).toBe(false);
    });
  });
});
