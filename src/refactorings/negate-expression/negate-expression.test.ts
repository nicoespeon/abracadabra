import { Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import * as t from "../../ast";
import { testEach } from "../../tests-helpers";

import { negateExpression, canNegateExpression } from "./negate-expression";

describe("Negate Expression", () => {
  testEach<{ code: Code }>(
    "should select expression if",
    [
      {
        description: "all expression is selected",
        code: `if ([start]a == b[end]) {}`
      },
      {
        description: "cursor is on left identifier",
        code: `if ([cursor]a == b) {}`
      },
      {
        description: "cursor is on operator",
        code: `if (a =[cursor]= b) {}`
      },
      {
        description: "cursor is on right identifier",
        code: `if (a == [cursor]b) {}`
      }
    ],
    async ({ code }) => {
      const editor = new InMemoryEditor(code);

      await negateExpression(editor);

      expect(editor.code).toBe(`if (!(a != b)) {}`);
    }
  );

  testEach<{
    code: Code;
    expected: Code;
  }>(
    "should negate expression",
    [
      {
        description: "loose equality",
        code: "if ([cursor]a == b) {}",
        expected: "if (!(a != b)) {}"
      },
      {
        description: "strict equality",
        code: "if ([cursor]a === b) {}",
        expected: "if (!(a !== b)) {}"
      },
      {
        description: "loose inequality",
        code: "if ([cursor]a != b) {}",
        expected: "if (!(a == b)) {}"
      },
      {
        description: "strict inequality",
        code: "if ([cursor]a !== b) {}",
        expected: "if (!(a === b)) {}"
      },
      {
        description: "lower than",
        code: "if ([cursor]a < b) {}",
        expected: "if (!(a >= b)) {}"
      },
      {
        description: "lower or equal",
        code: "if ([cursor]a <= b) {}",
        expected: "if (!(a > b)) {}"
      },
      {
        description: "greater than",
        code: "if ([cursor]a > b) {}",
        expected: "if (!(a <= b)) {}"
      },
      {
        description: "greater or equal",
        code: "if ([cursor]a >= b) {}",
        expected: "if (!(a < b)) {}"
      },
      {
        description: "logical and",
        code: "if (a == b &[cursor]& b == c) {}",
        expected: "if (!(a != b || b != c)) {}"
      },
      {
        description: "logical or",
        code: "if (a == b |[cursor]| b == c) {}",
        expected: "if (!(a != b && b != c)) {}"
      },
      {
        description: "already negated expression",
        code: "if ([cursor]!(a != b && b != c)) {}",
        expected: "if (a == b || b == c) {}"
      },
      {
        description: "already negated expression, multi-line",
        code: `if ([cursor]!(
  a != b &&
  b != c
)) {}`,
        expected: `if (a == b || b == c) {}`
      },
      {
        description: "identifiers (boolean values)",
        code: "if ([cursor]isValid || isCorrect) {}",
        expected: "if (!(!isValid && !isCorrect)) {}"
      },
      {
        description: "negated identifiers (boolean values)",
        code: "if ([cursor]!isValid || isCorrect) {}",
        expected: "if (!(isValid && !isCorrect)) {}"
      },
      {
        description: "3+ negated identifiers, cursor on last identifier",
        code: "if (!isValid && !isSelected && !isVI[cursor]P) {}",
        expected: "if (!(isValid || isSelected || isVIP)) {}"
      },
      {
        description: "non-negatable operators",
        code: "if ([cursor]a + b > 0) {}",
        expected: "if (!(a + b <= 0)) {}"
      },
      {
        description: "equality with cursor on 'typeof' operator",
        code: "if ([cursor]typeof location.lat === 'number') {}",
        expected: "if (!(typeof location.lat !== 'number')) {}"
      },
      {
        description:
          "logical expression with cursor on negated member expression",
        code: "if (!this.curren[cursor]tContext && isBackward) {}",
        expected: "if (!(this.currentContext || !isBackward)) {}"
      },
      {
        description: "left-side of a logical expression",
        code: "if (a == b[cursor] || b == c) {}",
        expected: "if (!(a != b) || b == c) {}"
      },
      {
        description: "right-side of a logical expression",
        code: "if (a == b || b == [cursor]c) {}",
        expected: "if (a == b || !(b != c)) {}"
      },
      {
        description: "whole logical expression if cursor is on identifier",
        code: "if (isVali[cursor]d || b == c) {}",
        expected: "if (!(!isValid && b != c)) {}"
      },
      {
        description:
          "whole logical expression if cursor is on negated identifier",
        code: "if (!isVal[cursor]id || b == c) {}",
        expected: "if (!(isValid && b != c)) {}"
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await negateExpression(editor);

      expect(editor.code).toBe(expected);
    }
  );

  it("should show an error message if selection can't be negated", async () => {
    const code = `console.log("Nothing to negate here!")`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await negateExpression(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindNegatableExpression
    );
  });

  it("should not negate a logical `||` used to fallback a variable declaration", async () => {
    const code = `const foo = bar |[cursor]| "default";`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await negateExpression(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindNegatableExpression
    );
  });
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
