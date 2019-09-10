import * as t from "@babel/types";

import { toSwitch, VALID_OPERATORS } from "./switch";

describe("AST Switch", () => {
  it("should return null if given expression is null", () => {
    const expression = t.nullLiteral();

    const result = toSwitch(expression);

    expect(result).toBe(null);
  });

  describe("BinaryExpression", () => {
    VALID_OPERATORS.forEach(operator =>
      shouldIdentifyDiscriminantWith(operator)
    );

    const INVALID_OPERATORS: t.BinaryExpression["operator"][] = [
      "+",
      "-",
      "/",
      "%",
      "*",
      "**",
      "&",
      "|",
      ">>",
      ">>>",
      "<<",
      "^",
      "!=",
      "!==",
      "in",
      "instanceof",
      ">",
      "<",
      ">=",
      "<="
    ];
    INVALID_OPERATORS.forEach(operator => shouldReturnNullWith(operator));

    function shouldIdentifyDiscriminantWith(
      operator: t.BinaryExpression["operator"]
    ) {
      describe(`Operator "${operator}"`, () => {
        it("should return the identifier when it's on the left", () => {
          const name = t.identifier("name");
          const john = t.stringLiteral("John");
          const expression = t.binaryExpression(operator, name, john);

          const result = toSwitch(expression);
          if (!result) {
            fail("No discriminant found in expression");
            return;
          }

          expect(result).toEqual({ discriminant: name, test: john });
        });

        it("should return the identifier when it's on the right", () => {
          const name = t.identifier("name");
          const john = t.stringLiteral("John");
          const expression = t.binaryExpression(operator, john, name);

          const result = toSwitch(expression);
          if (!result) {
            fail("No discriminant found in expression");
            return;
          }

          expect(result).toEqual({ discriminant: name, test: john });
        });

        it("should return the left identifier when both nodes are identifiers", () => {
          const john = t.identifier("john");
          const name = t.identifier("name");
          const expression = t.binaryExpression(operator, john, name);

          const result = toSwitch(expression);
          if (!result) {
            fail("No discriminant found in expression");
            return;
          }

          expect(result).toEqual({ discriminant: john, test: name });
        });
      });
    }

    function shouldReturnNullWith(operator: t.BinaryExpression["operator"]) {
      describe(`Operator "${operator}"`, () => {
        it("should return null when identifier is on the left", () => {
          const expression = t.binaryExpression(
            operator,
            t.identifier("name"),
            t.stringLiteral("John")
          );

          const result = toSwitch(expression);

          expect(result).toBe(null);
        });

        it("should return null when identifier is on the right", () => {
          const expression = t.binaryExpression(
            operator,
            t.stringLiteral("John"),
            t.identifier("name")
          );

          const result = toSwitch(expression);

          expect(result).toBe(null);
        });

        it("should return null when both nodes are identifiers", () => {
          const expression = t.binaryExpression(
            operator,
            t.identifier("john"),
            t.identifier("name")
          );

          const result = toSwitch(expression);

          expect(result).toBe(null);
        });
      });
    }
  });
});
