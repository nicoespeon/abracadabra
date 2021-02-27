import { Position } from "./position";

describe("Position", () => {
  describe("isBefore", () => {
    const ref = new Position(4, 10);
    const { line, character } = ref;

    it("should return true if position is at the same position than reference", () => {
      expect(ref.isBefore(ref)).toBe(true);
    });

    describe("position and reference on the same line", () => {
      it("should return true if position is before reference", () => {
        expect(new Position(line, character - 1).isBefore(ref)).toBe(true);
      });

      it("should return false if position is after reference", () => {
        expect(new Position(line, character + 1).isBefore(ref)).toBe(false);
      });
    });

    describe("position on a line before reference", () => {
      const newLine = line - 1;

      it("should return true if character is before reference", () => {
        expect(new Position(newLine, character - 1).isBefore(ref)).toBe(true);
      });

      it("should return true if character same reference", () => {
        expect(new Position(newLine, character).isBefore(ref)).toBe(true);
      });

      it("should return true if character is after reference", () => {
        expect(new Position(newLine, character + 1).isBefore(ref)).toBe(true);
      });
    });

    describe("position on a line after reference", () => {
      const newLine = line + 1;

      it("should return false if character is before reference", () => {
        expect(new Position(newLine, character - 1).isBefore(ref)).toBe(false);
      });

      it("should return false if character same reference", () => {
        expect(new Position(newLine, character).isBefore(ref)).toBe(false);
      });

      it("should return false if character is after reference", () => {
        expect(new Position(newLine, character + 1).isBefore(ref)).toBe(false);
      });
    });
  });

  describe("isAfter", () => {
    const ref = new Position(4, 10);
    const { line, character } = ref;

    it("should return true if position is at the same position than reference", () => {
      expect(ref.isAfter(ref)).toBe(true);
    });

    describe("position and reference on the same line", () => {
      it("should return true if position is after reference", () => {
        expect(new Position(line, character + 1).isAfter(ref)).toBe(true);
      });

      it("should return false if position is before reference", () => {
        expect(new Position(line, character - 1).isAfter(ref)).toBe(false);
      });
    });

    describe("position on a line before reference", () => {
      const newLine = line - 1;

      it("should return false if character is before reference", () => {
        expect(new Position(newLine, character - 1).isAfter(ref)).toBe(false);
      });

      it("should return false if character same reference", () => {
        expect(new Position(newLine, character).isAfter(ref)).toBe(false);
      });

      it("should return false if character is after reference", () => {
        expect(new Position(newLine, character + 1).isAfter(ref)).toBe(false);
      });
    });

    describe("position on a line after reference", () => {
      const newLine = line + 1;

      it("should return true if character is before reference", () => {
        expect(new Position(newLine, character - 1).isAfter(ref)).toBe(true);
      });

      it("should return true if character same reference", () => {
        expect(new Position(newLine, character).isAfter(ref)).toBe(true);
      });

      it("should return true if character is after reference", () => {
        expect(new Position(newLine, character + 1).isAfter(ref)).toBe(true);
      });
    });
  });

  describe("goToNextNthWordInCode", () => {
    it("should jump given number of words in given code", async () => {
      const code = `const hey = "ho";

interface Extracted {
  world: string;
  morning: boolean;
}`;
      const position = new Position(1, 0);

      const result = position.goToNextNthWordInCode(2, code);

      expect(result).toStrictEqual(new Position(2, 10));
    });
  });
});
