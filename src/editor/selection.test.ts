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

      const extendedSelection = selection.extendEndToStartOf(
        new Selection([3, 12], [3, 15])
      );

      expect(extendedSelection).toStrictEqual(new Selection([0, 10], [3, 12]));
    });

    it("should not change selection if the given one starts before our selection ends", () => {
      const selection = new Selection([0, 10], [3, 10]);

      const extendedSelection = selection.extendEndToStartOf(
        new Selection([2, 12], [3, 15])
      );

      expect(extendedSelection).toStrictEqual(new Selection([0, 10], [3, 10]));
    });
  });

  describe("extendStartTo", () => {
    it("should return selection that starts at given selection end", () => {
      const selection = new Selection([0, 10], [3, 10]);

      const extendedSelection = selection.extendStartToEndOf(
        new Selection([0, 0], [0, 3])
      );

      expect(extendedSelection).toStrictEqual(new Selection([0, 3], [3, 10]));
    });

    it("should not change selection if the given one ends after our selection starts", () => {
      const selection = new Selection([0, 10], [3, 10]);

      const extendedSelection = selection.extendStartToEndOf(
        new Selection([0, 0], [1, 3])
      );

      expect(extendedSelection).toStrictEqual(new Selection([0, 10], [3, 10]));
    });
  });

  describe("startsBefore", () => {
    it("should return true if selection starts before given one", () => {
      const selection = new Selection([1, 4], [1, 8]);
      const anotherSelection = new Selection([2, 4], [2, 5]);

      const result = selection.startsBefore(anotherSelection);

      expect(result).toBe(true);
    });

    it("should return true if selection starts at the same position as given one", () => {
      const selection = new Selection([1, 4], [1, 8]);
      const anotherSelection = new Selection([1, 4], [2, 5]);

      const result = selection.startsBefore(anotherSelection);

      expect(result).toBe(true);
    });
  });

  describe("exclude given selection, returning a list of selections", () => {
    it("same line, overlaps with end", () => {
      const selection = new Selection([0, 5], [0, 10]);
      const anotherSelection = new Selection([0, 7], [0, 20]);

      const result = selection.exclude(anotherSelection);

      expect(result).toStrictEqual([new Selection([0, 5], [0, 7])]);
    });

    it("same line, overlaps with start", () => {
      const selection = new Selection([0, 5], [0, 10]);
      const anotherSelection = new Selection([0, 0], [0, 8]);

      const result = selection.exclude(anotherSelection);

      expect(result).toStrictEqual([new Selection([0, 8], [0, 10])]);
    });

    it("same line, overlaps in-between", () => {
      const selection = new Selection([0, 5], [0, 10]);
      const anotherSelection = new Selection([0, 6], [0, 8]);

      const result = selection.exclude(anotherSelection);

      expect(result).toStrictEqual([
        new Selection([0, 5], [0, 6]),
        new Selection([0, 8], [0, 10])
      ]);
    });

    it("same line, no overlap", () => {
      const selection = new Selection([0, 5], [0, 10]);
      const anotherSelection = new Selection([0, 16], [0, 20]);

      const result = selection.exclude(anotherSelection);

      expect(result).toStrictEqual([selection]);
    });

    it("multiple lines, overlaps with end", () => {
      const selection = new Selection([0, 5], [2, 10]);
      const anotherSelection = new Selection([1, 7], [3, 20]);

      const result = selection.exclude(anotherSelection);

      expect(result).toStrictEqual([new Selection([0, 5], [1, 7])]);
    });

    it("multiple lines, overlaps with start", () => {
      const selection = new Selection([2, 5], [4, 10]);
      const anotherSelection = new Selection([0, 0], [3, 8]);

      const result = selection.exclude(anotherSelection);

      expect(result).toStrictEqual([new Selection([3, 8], [4, 10])]);
    });

    it("other selection completely overlaps selection", () => {
      const selection = new Selection([0, 5], [0, 10]);
      const anotherSelection = new Selection([0, 0], [0, 20]);

      const result = selection.exclude(anotherSelection);

      expect(result).toStrictEqual([]);
    });
  });

  describe("merge with given selection, returning a list of selections", () => {
    it("same line, overlaps with end", () => {
      const selection = new Selection([0, 5], [0, 10]);
      const anotherSelection = new Selection([0, 7], [0, 20]);

      const result = selection.mergeWith(anotherSelection);

      expect(result).toStrictEqual([new Selection([0, 5], [0, 20])]);
    });

    it("same line, overlaps with start", () => {
      const selection = new Selection([0, 5], [0, 10]);
      const anotherSelection = new Selection([0, 0], [0, 8]);

      const result = selection.mergeWith(anotherSelection);

      expect(result).toStrictEqual([new Selection([0, 0], [0, 10])]);
    });

    it("same line, overlaps in-between", () => {
      const selection = new Selection([0, 5], [0, 10]);
      const anotherSelection = new Selection([0, 6], [0, 8]);

      const result = selection.mergeWith(anotherSelection);

      expect(result).toStrictEqual([selection]);
    });

    it("same line, no overlap", () => {
      const selection = new Selection([0, 5], [0, 10]);
      const anotherSelection = new Selection([0, 16], [0, 20]);

      const result = selection.mergeWith(anotherSelection);

      expect(result).toStrictEqual([selection, anotherSelection]);
    });

    it("multiple lines, overlaps with end", () => {
      const selection = new Selection([0, 5], [2, 10]);
      const anotherSelection = new Selection([1, 7], [3, 20]);

      const result = selection.mergeWith(anotherSelection);

      expect(result).toStrictEqual([new Selection([0, 5], [3, 20])]);
    });

    it("multiple lines, overlaps with start", () => {
      const selection = new Selection([2, 5], [4, 10]);
      const anotherSelection = new Selection([0, 0], [3, 8]);

      const result = selection.mergeWith(anotherSelection);

      expect(result).toStrictEqual([new Selection([0, 0], [4, 10])]);
    });

    it("other selection completely overlaps selection", () => {
      const selection = new Selection([0, 5], [0, 10]);
      const anotherSelection = new Selection([0, 0], [0, 20]);

      const result = selection.mergeWith(anotherSelection);

      expect(result).toStrictEqual([anotherSelection]);
    });
  });

  describe("determine if other selection overlaps or touches", () => {
    it("can tell if another selection is overlapping", () => {
      const selection = new Selection([0, 10], [1, 20]);
      const other = new Selection([0, 7], [2, 10]);

      const result = selection.overlapsWith(other);

      expect(result).toBe(true);
    });

    it("can tell if another selection does not overlap", () => {
      const selection = new Selection([0, 10], [1, 20]);
      const other = new Selection([2, 7], [4, 10]);

      const result = selection.overlapsWith(other);

      expect(result).toBe(false);
    });

    it("can tell if another selection is touching", () => {
      const selection = new Selection([0, 10], [1, 20]);
      const other = new Selection([1, 20], [2, 10]);

      const result = selection.touches(other);

      expect(result).toBe(true);
    });

    it("can tell if another selection does not touch", () => {
      const selection = new Selection([0, 10], [1, 20]);
      const other = new Selection([2, 7], [4, 10]);

      const result = selection.touches(other);

      expect(result).toBe(false);
    });

    it("considers touching if it overlaps", () => {
      const selection = new Selection([0, 10], [1, 20]);
      const other = new Selection([0, 7], [2, 10]);

      const result = selection.touches(other);

      expect(result).toBe(true);
    });

    it("does not consider overlapping if it just touches", () => {
      const selection = new Selection([0, 10], [1, 20]);
      const other = new Selection([1, 20], [2, 10]);

      const result = selection.overlapsWith(other);

      expect(result).toBe(false);
    });
  });
});
