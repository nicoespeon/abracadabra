import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import * as t from "../../ast";
import { testEach } from "../../tests-helpers";

import { negateExpression, canNegateExpression } from "./negate-expression";

describe("Negate Expression", () => {
  let showErrorMessage: Editor["showError"];

  beforeEach(() => {
    showErrorMessage = jest.fn();
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

      const result = await doNegateExpression(code, selection);

      expect(result).toBe(`if (!(a != b)) {}`);
    }
  );

  testEach<{
    expression: Code;
    selection?: Selection;
    expected: Code;
  }>(
    "should negate expression",
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
        description: "already negated expression",
        expression: "!(a != b && b != c)",
        selection: Selection.cursorAt(0, 14),
        expected: "a == b || b == c"
      },
      {
        description: "already negated expression, multi-line",
        expression: `!(
  a != b &&
  b != c
)`,
        selection: Selection.cursorAt(0, 4),
        expected: `a == b || b == c`
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
        description: "non-negatable operators",
        expression: "a + b > 0",
        selection: Selection.cursorAt(0, 6),
        expected: "!(a + b <= 0)"
      },
      {
        description: "equality with cursor on 'typeof' operator",
        expression: "typeof location.lat === 'number'",
        expected: "!(typeof location.lat !== 'number')"
      },
      {
        description:
          "logical expression with cursor on negated member expression",
        expression: "!this.currentContext && isBackward",
        selection: Selection.cursorAt(0, 12),
        expected: "!(this.currentContext || !isBackward)"
      },
      {
        description: "left-side of a logical expression",
        expression: "a == b || b == c",
        selection: Selection.cursorAt(0, 6),
        expected: "!(a != b) || b == c"
      },
      {
        description: "right-side of a logical expression",
        expression: "a == b || b == c",
        selection: Selection.cursorAt(0, 15),
        expected: "a == b || !(b != c)"
      },
      {
        description: "whole logical expression if cursor is on identifier",
        expression: "isValid || b == c",
        selection: Selection.cursorAt(0, 6),
        expected: "!(!isValid && b != c)"
      },
      {
        description:
          "whole logical expression if cursor is on negated identifier",
        expression: "!isValid || b == c",
        selection: Selection.cursorAt(0, 6),
        expected: "!(isValid && b != c)"
      }
    ],
    async ({ expression, selection = Selection.cursorAt(0, 4), expected }) => {
      const code = `if (${expression}) {}`;

      const result = await doNegateExpression(code, selection);

      expect(result).toBe(`if (${expected}) {}`);
    }
  );

  it("should show an error message if selection can't be negated", async () => {
    const code = `console.log("Nothing to negate here!")`;
    const selection = Selection.cursorAt(0, 0);

    await doNegateExpression(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFindNegatableExpression
    );
  });

  it("should not negate a logical `||` used to fallback a variable declaration", async () => {
    const code = `const foo = bar || "default";`;
    const selection = Selection.cursorAt(0, 17);

    await doNegateExpression(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFindNegatableExpression
    );
  });

  async function doNegateExpression(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const editor = new InMemoryEditor(code);
    editor.showError = showErrorMessage;
    await negateExpression(code, selection, editor);
    return editor.code;
  }
});

describe("Finding negatable expression (quick fix)", () => {
  testEach(
    "should match against",
    [
      {
        description: "logical expressions",
        code: `if (a > b) {}`,
        selection: Selection.cursorAt(0, 4)
      },
      {
        description: "binary expressions",
        code: `function result() {
  return a === 0;
}`,
        selection: Selection.cursorAt(1, 13)
      }
    ],
    ({ code, selection = Selection.cursorAt(0, 13) }) => {
      let canNegate = false;
      t.traverseAST(
        t.parse(code),
        canNegateExpression(selection, () => (canNegate = true))
      );

      expect(canNegate).toBe(true);
    }
  );

  testEach(
    "should not match against",
    [
      {
        description: "concatenable operators",
        code: `function result() {
  return "(" + this.getValue() + ")";
}`,
        selection: Selection.cursorAt(1, 13)
      },
      {
        description: "a single unary expression",
        code: `if (!isValid) {}`,
        selection: Selection.cursorAt(0, 4)
      },
      {
        description: "a single unary expression (call expression)",
        code: `if (!isValid()) {}`,
        selection: Selection.cursorAt(0, 4)
      }
    ],
    ({ code, selection = Selection.cursorAt(0, 13) }) => {
      let canNegate = false;
      t.traverseAST(
        t.parse(code),
        canNegateExpression(selection, () => (canNegate = true))
      );

      expect(canNegate).toBe(false);
    }
  );
});
