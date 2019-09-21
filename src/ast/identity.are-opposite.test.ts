import { testEach } from "../tests-helpers";

import * as t from "./domain";
import { areOppositeOperators } from "./identity";

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
