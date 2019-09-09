import * as t from "@babel/types";

import { getDiscriminantFrom, VALID_OPERATORS } from "./discriminant";

describe("AST Discriminant", () => {
  it("should return null if given expression is null", () => {
    const expression = t.nullLiteral();

    const discriminant = getDiscriminantFrom(expression);

    expect(discriminant).toBe(null);
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
          const expression = t.binaryExpression(
            operator,
            name,
            t.stringLiteral("John")
          );

          const discriminant = getDiscriminantFrom(expression);

          expect(discriminant).toBe(name);
        });

        it("should return the identifier when it's on the right", () => {
          const name = t.identifier("name");
          const expression = t.binaryExpression(
            operator,
            t.stringLiteral("John"),
            name
          );

          const discriminant = getDiscriminantFrom(expression);

          expect(discriminant).toBe(name);
        });

        it("should return the left identifier when both nodes are identifiers", () => {
          const john = t.identifier("john");
          const expression = t.binaryExpression(
            operator,
            john,
            t.identifier("name")
          );

          const discriminant = getDiscriminantFrom(expression);

          expect(discriminant).toBe(john);
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

          const discriminant = getDiscriminantFrom(expression);

          expect(discriminant).toBe(null);
        });

        it("should return null when identifier is on the right", () => {
          const expression = t.binaryExpression(
            operator,
            t.stringLiteral("John"),
            t.identifier("name")
          );

          const discriminant = getDiscriminantFrom(expression);

          expect(discriminant).toBe(null);
        });

        it("should return null when both nodes are identifiers", () => {
          const expression = t.binaryExpression(
            operator,
            t.identifier("john"),
            t.identifier("name")
          );

          const discriminant = getDiscriminantFrom(expression);

          expect(discriminant).toBe(null);
        });
      });
    }
  });
});
