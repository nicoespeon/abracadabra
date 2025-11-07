import * as t from "./domain";
import { areOpposite, areOppositeOperators } from "./identity";

describe("Identity - Are opposite expressions", () => {
  it("should return false if we pass non binary expressions", () => {
    const testA = t.stringLiteral("John");
    const testB = t.stringLiteral("Jane");

    const result = areOpposite(testA, testB);

    expect(result).toBe(false);
  });

  describe("binary expressions", () => {
    const name = t.identifier("name");
    const itemName = t.memberExpression(t.identifier("item"), name);
    const john = t.stringLiteral("John");
    const martin = t.stringLiteral("Martin");

    describe("should return true", () => {
      it("same operator & left, but different right", () => {
        const testA = t.binaryExpression("===", name, john);
        const testB = t.binaryExpression("===", name, martin);

        expect(areOpposite(testA, testB)).toBe(true);
      });

      it("same left & right, but opposite operators", () => {
        const testA = t.binaryExpression("===", name, john);
        const testB = t.binaryExpression("!==", name, john);

        expect(areOpposite(testA, testB)).toBe(true);
      });

      it("left is a member expression", () => {
        const testA = t.binaryExpression("===", itemName, john);
        const testB = t.binaryExpression("!==", itemName, john);

        expect(areOpposite(testA, testB)).toBe(true);
      });

      it("== operator", () => {
        const testA = t.binaryExpression("==", name, john);
        const testB = t.binaryExpression("==", name, martin);

        expect(areOpposite(testA, testB)).toBe(true);
      });
    });

    describe("should return false", () => {
      it("identical expressions", () => {
        const testA = t.binaryExpression("===", name, john);
        const testB = t.binaryExpression("===", name, john);

        expect(areOpposite(testA, testB)).toBe(false);
      });

      it("different left", () => {
        const testA = t.binaryExpression("===", name, john);
        const testB = t.binaryExpression("===", t.identifier("lastName"), john);

        expect(areOpposite(testA, testB)).toBe(false);
      });

      it("different (non-opposite) operators", () => {
        const testA = t.binaryExpression("===", name, john);
        const testB = t.binaryExpression(">", name, john);

        expect(areOpposite(testA, testB)).toBe(false);
      });

      it("different right, but !== operator", () => {
        const testA = t.binaryExpression("!==", name, john);
        const testB = t.binaryExpression("!==", name, martin);

        expect(areOpposite(testA, testB)).toBe(false);
      });
    });
  });
});

describe("Identity - Are opposite operators", () => {
  describe("should return false", () => {
    it("identical operators", () => {
      expect(areOppositeOperators("===", "===")).toBe(false);
    });

    it("non-opposite operators", () => {
      expect(areOppositeOperators("===", ">")).toBe(false);
    });

    it("similar operators", () => {
      expect(areOppositeOperators("===", "==")).toBe(false);
    });
  });

  describe("should return true", () => {
    it("=== and !==", () => {
      expect(areOppositeOperators("===", "!==")).toBe(true);
    });

    it("reverse order", () => {
      expect(areOppositeOperators("!==", "===")).toBe(true);
    });

    it("== and !=", () => {
      expect(areOppositeOperators("==", "!=")).toBe(true);
    });

    it("> and <=", () => {
      expect(areOppositeOperators(">", "<=")).toBe(true);
    });

    it("> and <", () => {
      expect(areOppositeOperators(">", "<")).toBe(true);
    });

    it(">= and <", () => {
      expect(areOppositeOperators(">=", "<")).toBe(true);
    });
  });
});
