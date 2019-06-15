import { UpdateWith, Update, Code } from "./i-update-code";
import { negateExpression } from "./negate-expression";
import { Selection } from "./selection";

describe("Negate Expression", () => {
  let updateWith: UpdateWith;
  let updates: Update[] = [];
  let updatedExpression = "";

  beforeEach(() => {
    updates = [];
    updatedExpression = "";
    updateWith = jest
      .fn()
      .mockImplementation(
        (_, getUpdates) => (updates = getUpdates(updatedExpression))
      );
  });

  it.each<[string, Selection]>([
    ["all expression is selected", new Selection([0, 4], [0, 10])],
    ["cursor is on left identifier", Selection.cursorAt(0, 4)],
    ["cursor is on operator", Selection.cursorAt(0, 7)],
    ["cursor is on right identifier", Selection.cursorAt(0, 9)]
  ])("should select expression if %s", async (_, selection) => {
    const code = `if (a == b) {}`;

    await doNegateExpression(code, selection);

    expect(updateWith).toBeCalledWith(
      new Selection([0, 4], [0, 10]),
      expect.any(Function)
    );
  });

  it.each<[string, Assertion]>([
    [
      "loose equality",
      {
        expression: "a == b",
        expected: {
          code: "!(a != b)",
          selection: new Selection([0, 4], [0, 10])
        }
      }
    ],
    [
      "strict equality",
      {
        expression: "a === b",
        expected: {
          code: "!(a !== b)",
          selection: new Selection([0, 4], [0, 11])
        }
      }
    ],
    [
      "loose inequality",
      {
        expression: "a != b",
        expected: {
          code: "!(a == b)",
          selection: new Selection([0, 4], [0, 10])
        }
      }
    ],
    [
      "strict inequality",
      {
        expression: "a !== b",
        expected: {
          code: "!(a === b)",
          selection: new Selection([0, 4], [0, 11])
        }
      }
    ],
    [
      "lower than",
      {
        expression: "a < b",
        expected: {
          code: "!(a >= b)",
          selection: new Selection([0, 4], [0, 9])
        }
      }
    ],
    [
      "lower or equal",
      {
        expression: "a <= b",
        expected: {
          code: "!(a > b)",
          selection: new Selection([0, 4], [0, 10])
        }
      }
    ],
    [
      "greater than",
      {
        expression: "a > b",
        expected: {
          code: "!(a <= b)",
          selection: new Selection([0, 4], [0, 9])
        }
      }
    ],
    [
      "greater or equal",
      {
        expression: "a >= b",
        expected: {
          code: "!(a < b)",
          selection: new Selection([0, 4], [0, 10])
        }
      }
    ],
    [
      "logical and",
      {
        expression: "a == b && b == c",
        selection: Selection.cursorAt(0, 12),
        expected: {
          code: "!(a != b || b != c)",
          selection: new Selection([0, 4], [0, 20])
        }
      }
    ],
    [
      "logical or",
      {
        expression: "a == b || b == c",
        selection: Selection.cursorAt(0, 12),
        expected: {
          code: "!(a != b && b != c)",
          selection: new Selection([0, 4], [0, 20])
        }
      }
    ]
  ])("should negate %s", async (_, { expression, selection, expected }) => {
    updatedExpression = expression;
    const code = `if (${expression}) {}`;
    const DEFAULT_SELECTION = Selection.cursorAt(0, 4);

    await doNegateExpression(code, selection || DEFAULT_SELECTION);

    expect(updates).toEqual([expected]);
  });

  async function doNegateExpression(code: Code, selection: Selection) {
    await negateExpression(code, selection, updateWith);
  }
});

interface Assertion {
  expression: Code;
  selection?: Selection;
  expected: Update;
}
