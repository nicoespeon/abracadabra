import { testEach } from "../tests-helpers";

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

    testEach<{ testA: t.BinaryExpression; testB: t.BinaryExpression }>(
      "should return true",
      [
        {
          description: "same operator & left, but different right",
          testA: t.binaryExpression("===", name, john),
          testB: t.binaryExpression("===", name, martin)
        },
        {
          description: "same left & right, but opposite operators",
          testA: t.binaryExpression("===", name, john),
          testB: t.binaryExpression("!==", name, john)
        },
        {
          description: "left is a member expression",
          testA: t.binaryExpression("===", itemName, john),
          testB: t.binaryExpression("!==", itemName, john)
        },
        {
          description: "== operator",
          testA: t.binaryExpression("==", name, john),
          testB: t.binaryExpression("==", name, martin)
        }
      ],
      ({ testA, testB }) => {
        expect(areOpposite(testA, testB)).toBe(true);
      }
    );

    testEach<{ testA: t.BinaryExpression; testB: t.BinaryExpression }>(
      "should return false",
      [
        {
          description: "identical expressions",
          testA: t.binaryExpression("===", name, john),
          testB: t.binaryExpression("===", name, john)
        },
        {
          description: "different left",
          testA: t.binaryExpression("===", name, john),
          testB: t.binaryExpression("===", t.identifier("lastName"), john)
        },
        {
          description: "different (non-opposite) operators",
          testA: t.binaryExpression("===", name, john),
          testB: t.binaryExpression(">", name, john)
        },
        {
          description: "different right, but !== operator",
          testA: t.binaryExpression("!==", name, john),
          testB: t.binaryExpression("!==", name, martin)
        }
      ],
      ({ testA, testB }) => {
        expect(areOpposite(testA, testB)).toBe(false);
      }
    );
  });
});

describe("Identity - Are opposite operators", () => {
  testEach<{
    operatorA: t.BinaryExpression["operator"];
    operatorB: t.BinaryExpression["operator"];
  }>(
    "should return false",
    [
      {
        description: "identical operators",
        operatorA: "===",
        operatorB: "==="
      },
      {
        description: "non-opposite operators",
        operatorA: "===",
        operatorB: ">"
      },
      {
        description: "similar operators",
        operatorA: "===",
        operatorB: "=="
      }
    ],
    async ({ operatorA, operatorB }) => {
      expect(areOppositeOperators(operatorA, operatorB)).toBe(false);
    }
  );

  testEach<{
    operatorA: t.BinaryExpression["operator"];
    operatorB: t.BinaryExpression["operator"];
  }>(
    "should return true",
    [
      {
        description: "=== and !==",
        operatorA: "===",
        operatorB: "!=="
      },
      {
        description: "reverse order",
        operatorA: "!==",
        operatorB: "==="
      },
      {
        description: "== and !=",
        operatorA: "==",
        operatorB: "!="
      },
      {
        description: "> and <=",
        operatorA: ">",
        operatorB: "<="
      },
      {
        description: "> and <",
        operatorA: ">",
        operatorB: "<"
      },
      {
        description: ">= and <",
        operatorA: ">=",
        operatorB: "<"
      }
    ],
    async ({ operatorA, operatorB }) => {
      expect(areOppositeOperators(operatorA, operatorB)).toBe(true);
    }
  );
});
