import { ReadThenWrite, Update, Code } from "../editor/i-write-code";
import { Selection } from "../editor/selection";
import { ShowErrorMessage, ErrorReason } from "../editor/i-show-error-message";
import { negateExpression, findNegatableExpression } from "./negate-expression";
import { testEach } from "../tests-helpers";

describe("Negate Expression", () => {
  let showErrorMessage: ShowErrorMessage;
  let readThenWrite: ReadThenWrite;
  let updates: Update[] = [];
  let updatedExpression = "";

  beforeEach(() => {
    showErrorMessage = jest.fn();
    updates = [];
    updatedExpression = "";
    readThenWrite = jest
      .fn()
      .mockImplementation(
        (_, getUpdates) => (updates = getUpdates(updatedExpression))
      );
  });

  testEach<{ selection: Selection }>(
    "should select expression if",
    [
      {
        description: "all expression is selected",
        selection: new Selection([0, 4], [0, 10])
      },
      {
        description: "cursor is on left identifier",
        selection: Selection.cursorAt(0, 4)
      },
      {
        description: "cursor is on operator",
        selection: Selection.cursorAt(0, 7)
      },
      {
        description: "cursor is on right identifier",
        selection: Selection.cursorAt(0, 9)
      }
    ],
    async ({ selection }) => {
      const code = `if (a == b) {}`;

      await doNegateExpression(code, selection);

      expect(readThenWrite).toBeCalledWith(
        new Selection([0, 4], [0, 10]),
        expect.any(Function)
      );
    }
  );

  testEach<{
    expression: Code;
    selection?: Selection;
    expected: Code;
  }>(
    "should negate",
    [
      {
        description: "loose equality",
        expression: "a == b",
        expected: "!(a != b)"
      },
      {
        description: "strict equality",
        expression: "a === b",
        expected: "!(a !== b)"
      },
      {
        description: "loose inequality",
        expression: "a != b",
        expected: "!(a == b)"
      },
      {
        description: "strict inequality",
        expression: "a !== b",
        expected: "!(a === b)"
      },
      {
        description: "lower than",
        expression: "a < b",
        expected: "!(a >= b)"
      },
      {
        description: "lower or equal",
        expression: "a <= b",
        expected: "!(a > b)"
      },
      {
        description: "greater than",
        expression: "a > b",
        expected: "!(a <= b)"
      },
      {
        description: "greater or equal",
        expression: "a >= b",
        expected: "!(a < b)"
      },
      {
        description: "logical and",
        expression: "a == b && b == c",
        selection: Selection.cursorAt(0, 12),
        expected: "!(a != b || b != c)"
      },
      {
        description: "logical or",
        expression: "a == b || b == c",
        selection: Selection.cursorAt(0, 12),
        expected: "!(a != b && b != c)"
      },
      {
        description: "an already negated expression",
        expression: "!(a != b && b != c)",
        selection: Selection.cursorAt(0, 14),
        expected: "a == b || b == c"
      },
      {
        description: "identifiers (boolean values)",
        expression: "isValid || isCorrect",
        selection: Selection.cursorAt(0, 13),
        expected: "!(!isValid && !isCorrect)"
      },
      {
        description: "negated identifiers (boolean values)",
        expression: "!isValid || isCorrect",
        selection: Selection.cursorAt(0, 14),
        expected: "!(isValid && !isCorrect)"
      },
      {
        description: "expression with non-negatable operators",
        expression: "a + b > 0",
        selection: Selection.cursorAt(0, 6),
        expected: "!(a + b <= 0)"
      },
      {
        description: "an equality with cursor on 'typeof' operator",
        expression: "typeof location.lat === 'number'",
        expected: "!(typeof location.lat !== 'number')"
      },
      {
        description:
          "a logical expression with cursor on negated member expression",
        expression: "!this.currentContext && isBackward",
        selection: Selection.cursorAt(0, 12),
        expected: "!(this.currentContext || !isBackward)"
      }
    ],
    async ({ expression, selection, expected }) => {
      updatedExpression = expression;
      const code = `if (${expression}) {}`;
      const DEFAULT_SELECTION = Selection.cursorAt(0, 4);

      await doNegateExpression(code, selection || DEFAULT_SELECTION);

      expect(updates).toEqual([
        {
          code: expected,
          selection: new Selection([0, 4], [0, 4 + expression.length])
        }
      ]);
    }
  );

  it("should negate the left-side of a logical expression", async () => {
    const code = `if (a == b || b == c) {}`;
    const selection = Selection.cursorAt(0, 6);

    await doNegateExpression(code, selection);

    expect(readThenWrite).toBeCalledWith(
      new Selection([0, 4], [0, 10]),
      expect.any(Function)
    );
  });

  it("should negate the right-side of a logical expression", async () => {
    const code = `if (a == b || b == c) {}`;
    const selection = Selection.cursorAt(0, 15);

    await doNegateExpression(code, selection);

    expect(readThenWrite).toBeCalledWith(
      new Selection([0, 14], [0, 20]),
      expect.any(Function)
    );
  });

  it("should negate the whole logical expression if cursor is on identifier", async () => {
    const code = `if (isValid || b == c) {}`;
    const selection = Selection.cursorAt(0, 6);

    await doNegateExpression(code, selection);

    expect(readThenWrite).toBeCalledWith(
      new Selection([0, 4], [0, 21]),
      expect.any(Function)
    );
  });

  it("should negate the whole logical expression if cursor is on a negated identifier", async () => {
    const code = `if (!isValid || b == c) {}`;
    const selection = Selection.cursorAt(0, 6);

    await doNegateExpression(code, selection);

    expect(readThenWrite).toBeCalledWith(
      new Selection([0, 4], [0, 22]),
      expect.any(Function)
    );
  });

  it("should show an error message if selection can't be negated", async () => {
    const code = `console.log("Nothing to negate here!")`;
    const selection = Selection.cursorAt(0, 0);

    await doNegateExpression(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundNegatableExpression
    );
  });

  it("should not negate a logical `||` used to fallback a variable declaration", async () => {
    const code = `const foo = bar || "default";`;
    const selection = Selection.cursorAt(0, 17);

    await doNegateExpression(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundNegatableExpression
    );
  });

  async function doNegateExpression(code: Code, selection: Selection) {
    await negateExpression(code, selection, readThenWrite, showErrorMessage);
  }
});

describe("Finding negatable expression (quick fix)", () => {
  it("should match against logical expressions", async () => {
    const code = `if (a > b) {}`;
    const selection = Selection.cursorAt(0, 4);

    const expression = findNegatableExpression(code, selection);

    expect(expression).toBeDefined();
  });

  it("should match against binary expressions", async () => {
    const code = `function result() {
  return a === 0;
}`;
    const selection = Selection.cursorAt(1, 13);

    const expression = findNegatableExpression(code, selection);

    expect(expression).toBeDefined();
  });

  it("should not match against concatenable operators", async () => {
    const code = `function result() {
  return "(" + this.getValue() + ")";
}`;
    const selection = Selection.cursorAt(1, 13);

    const expression = findNegatableExpression(code, selection);

    expect(expression).toBeUndefined();
  });
});
