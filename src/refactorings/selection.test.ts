import { Selection } from "./selection";

describe("Selection", () => {
  describe("extendToStartOfLine", () => {
    it("should return same selection if already at start of line", () => {
      const selection = new Selection([0, 0], [0, 10]);

      const extendedSelection = selection.extendToStartOfLine();

      expect(extendedSelection).toStrictEqual(selection);
    });

    it("should return selection that begins at start of line", () => {
      const selection = new Selection([0, 4], [0, 10]);

      const extendedSelection = selection.extendToStartOfLine();

      expect(extendedSelection).toStrictEqual(new Selection([0, 0], [0, 10]));
    });
  });

  describe("extendToStartOfNextLine", () => {
    it("should return selection that ends at start of the next line", () => {
      const selection = new Selection([0, 10], [3, 10]);

      const extendedSelection = selection.extendToStartOfNextLine();

      expect(extendedSelection).toStrictEqual(new Selection([0, 10], [4, 0]));
    });
  });
});
