import * as t from "../../ast";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Selection } from "../../editor/selection";
import { createVisitor, invertBooleanLogic } from "./invert-boolean-logic";

describe("Invert Boolean Logic", () => {
  describe("should select expression if", () => {
    it("all expression is selected", async () => {
      await shouldInvertBooleanLogic({
        code: `if ([start]a == b[end]) {}`,
        expected: `if (!(a != b)) {}`
      });
    });

    it("cursor is on left identifier", async () => {
      await shouldInvertBooleanLogic({
        code: `if ([cursor]a == b) {}`,
        expected: `if (!(a != b)) {}`
      });
    });

    it("cursor is on operator", async () => {
      await shouldInvertBooleanLogic({
        code: `if (a =[cursor]= b) {}`,
        expected: `if (!(a != b)) {}`
      });
    });

    it("cursor is on right identifier", async () => {
      await shouldInvertBooleanLogic({
        code: `if (a == [cursor]b) {}`,
        expected: `if (!(a != b)) {}`
      });
    });
  });

  describe("should invert expression", () => {
    it("loose equality", async () => {
      await shouldInvertBooleanLogic({
        code: "if ([cursor]a == b) {}",
        expected: "if (!(a != b)) {}"
      });
    });

    it("strict equality", async () => {
      await shouldInvertBooleanLogic({
        code: "if ([cursor]a === b) {}",
        expected: "if (!(a !== b)) {}"
      });
    });

    it("loose inequality", async () => {
      await shouldInvertBooleanLogic({
        code: "if ([cursor]a != b) {}",
        expected: "if (!(a == b)) {}"
      });
    });

    it("strict inequality", async () => {
      await shouldInvertBooleanLogic({
        code: "if ([cursor]a !== b) {}",
        expected: "if (!(a === b)) {}"
      });
    });

    it("lower than", async () => {
      await shouldInvertBooleanLogic({
        code: "if ([cursor]a < b) {}",
        expected: "if (!(a >= b)) {}"
      });
    });

    it("lower or equal", async () => {
      await shouldInvertBooleanLogic({
        code: "if ([cursor]a <= b) {}",
        expected: "if (!(a > b)) {}"
      });
    });

    it("greater than", async () => {
      await shouldInvertBooleanLogic({
        code: "if ([cursor]a > b) {}",
        expected: "if (!(a <= b)) {}"
      });
    });

    it("greater or equal", async () => {
      await shouldInvertBooleanLogic({
        code: "if ([cursor]a >= b) {}",
        expected: "if (!(a < b)) {}"
      });
    });

    it("logical and", async () => {
      await shouldInvertBooleanLogic({
        code: "if (a == b &[cursor]& b == c) {}",
        expected: "if (!(a != b || b != c)) {}"
      });
    });

    it("logical or", async () => {
      await shouldInvertBooleanLogic({
        code: "if (a == b |[cursor]| b == c) {}",
        expected: "if (!(a != b && b != c)) {}"
      });
    });

    it("already inverted expression", async () => {
      await shouldInvertBooleanLogic({
        code: "if ([cursor]!(a != b && b != c)) {}",
        expected: "if (a == b || b == c) {}"
      });
    });

    it("already inverted expression, multi-line", async () => {
      await shouldInvertBooleanLogic({
        code: `if ([cursor]!(
  a != b &&
  b != c
)) {}`,
        expected: `if (a == b || b == c) {}`
      });
    });

    it("identifiers (boolean values)", async () => {
      await shouldInvertBooleanLogic({
        code: "if ([cursor]isValid || isCorrect) {}",
        expected: "if (!(!isValid && !isCorrect)) {}"
      });
    });

    it("inverted identifiers (boolean values)", async () => {
      await shouldInvertBooleanLogic({
        code: "if ([cursor]!isValid || isCorrect) {}",
        expected: "if (!(isValid && !isCorrect)) {}"
      });
    });

    it("3+ inverted identifiers, cursor on last identifier", async () => {
      await shouldInvertBooleanLogic({
        code: "if (!isValid && !isSelected && !isVI[cursor]P) {}",
        expected: "if (!(isValid || isSelected || isVIP)) {}"
      });
    });

    it("non-invertable operators", async () => {
      await shouldInvertBooleanLogic({
        code: "if ([cursor]a + b > 0) {}",
        expected: "if (!(a + b <= 0)) {}"
      });
    });

    it("equality with cursor on 'typeof' operator", async () => {
      await shouldInvertBooleanLogic({
        code: "if ([cursor]typeof location.lat === 'number') {}",
        expected: "if (!(typeof location.lat !== 'number')) {}"
      });
    });

    it("logical expression with cursor on inverted member expression", async () => {
      await shouldInvertBooleanLogic({
        code: "if (!this.curren[cursor]tContext && isBackward) {}",
        expected: "if (!(this.currentContext || !isBackward)) {}"
      });
    });

    it("left-side of a logical expression", async () => {
      await shouldInvertBooleanLogic({
        code: "if (a == b[cursor] || b == c) {}",
        expected: "if (!(a != b) || b == c) {}"
      });
    });

    it("right-side of a logical expression", async () => {
      await shouldInvertBooleanLogic({
        code: "if (a == b || b == [cursor]c) {}",
        expected: "if (a == b || !(b != c)) {}"
      });
    });

    it("whole logical expression if cursor is on identifier", async () => {
      await shouldInvertBooleanLogic({
        code: "if (isVali[cursor]d || b == c) {}",
        expected: "if (!(!isValid && b != c)) {}"
      });
    });

    it("whole logical expression if cursor is on inverted identifier", async () => {
      await shouldInvertBooleanLogic({
        code: "if (!isVal[cursor]id || b == c) {}",
        expected: "if (!(isValid && b != c)) {}"
      });
    });
  });

  it("should show an error message if selection can't be inverted", async () => {
    const code = `console.log("Nothing to invert here!")`;
    const editor = new InMemoryEditor(code);
    const result = invertBooleanLogic({
      state: "new",
      code: editor.code,
      selection: editor.selection,
      highlightSources: []
    });

    expect(result.action).toBe("show error");
  });

  it("should not invert a logical `||` used to fallback a variable declaration", async () => {
    const code = `const foo = bar |[cursor]| "default";`;
    const editor = new InMemoryEditor(code);
    const result = invertBooleanLogic({
      state: "new",
      code: editor.code,
      selection: editor.selection,
      highlightSources: []
    });

    expect(result.action).toBe("show error");
  });
});

describe("Finding invertable expression (quick fix)", () => {
  describe("should match against", () => {
    it("logical expressions", async () => {
      const code = `if (a > b) {}`;
      const selection = Selection.cursorAt(0, 4);
      let canNegate = false;
      t.traverseAST(
        t.parse(code),
        createVisitor(selection, () => (canNegate = true))
      );

      expect(canNegate).toBe(true);
    });

    it("binary expressions", async () => {
      const code = `function result() {
  return a === 0;
}`;
      const selection = Selection.cursorAt(1, 13);
      let canNegate = false;
      t.traverseAST(
        t.parse(code),
        createVisitor(selection, () => (canNegate = true))
      );

      expect(canNegate).toBe(true);
    });
  });

  describe("should not match against", () => {
    it("concatenable operators", async () => {
      const code = `function result() {
  return "(" + this.getValue() + ")";
}`;
      const selection = Selection.cursorAt(1, 13);
      let canNegate = false;
      t.traverseAST(
        t.parse(code),
        createVisitor(selection, () => (canNegate = true))
      );

      expect(canNegate).toBe(false);
    });

    it("a single unary expression", async () => {
      const code = `if (!isValid) {}`;
      const selection = Selection.cursorAt(0, 4);
      let canNegate = false;
      t.traverseAST(
        t.parse(code),
        createVisitor(selection, () => (canNegate = true))
      );

      expect(canNegate).toBe(false);
    });

    it("a single unary expression (call expression)", async () => {
      const code = `if (!isValid()) {}`;
      const selection = Selection.cursorAt(0, 4);
      let canNegate = false;
      t.traverseAST(
        t.parse(code),
        createVisitor(selection, () => (canNegate = true))
      );

      expect(canNegate).toBe(false);
    });
  });
});

async function shouldInvertBooleanLogic({
  code,
  expected
}: {
  code: string;
  expected: string;
}) {
  const editor = new InMemoryEditor(code);
  const result = invertBooleanLogic({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });

  if (result.action !== "read then write") {
    throw new Error(
      `Expected 'read then write' action, but got '${result.action}'`
    );
  }
  await editor.readThenWrite(
    result.readSelection,
    result.getModifications,
    result.newCursorPosition
  );
  expect(editor.code).toBe(expected);
}
