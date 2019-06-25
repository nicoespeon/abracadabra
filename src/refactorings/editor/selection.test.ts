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

  describe("extendEndTo", () => {
    it("should return selection that ends at given selection start", () => {
      const selection = new Selection([0, 10], [3, 10]);

      const extendedSelection = selection.extendEndTo(
        new Selection([3, 12], [3, 15])
      );

      expect(extendedSelection).toStrictEqual(new Selection([0, 10], [3, 12]));
    });

    it("should not change selection if the given one starts before our selection ends", () => {
      const selection = new Selection([0, 10], [3, 10]);

      const extendedSelection = selection.extendEndTo(
        new Selection([2, 12], [3, 15])
      );

      expect(extendedSelection).toStrictEqual(new Selection([0, 10], [3, 10]));
    });
  });

  describe("extendStartTo", () => {
    it("should return selection that starts at given selection end", () => {
      const selection = new Selection([0, 10], [3, 10]);

      const extendedSelection = selection.extendStartTo(
        new Selection([0, 0], [0, 3])
      );

      expect(extendedSelection).toStrictEqual(new Selection([0, 3], [3, 10]));
    });

    it("should not change selection if the given one ends after our selection starts", () => {
      const selection = new Selection([0, 10], [3, 10]);

      const extendedSelection = selection.extendStartTo(
        new Selection([0, 0], [1, 3])
      );

      expect(extendedSelection).toStrictEqual(new Selection([0, 10], [3, 10]));
    });
  });
});
