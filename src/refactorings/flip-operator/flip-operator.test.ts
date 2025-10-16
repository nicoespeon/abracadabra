import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code } from "../../editor/editor";
import { flipOperator } from "./flip-operator";

describe("Flip Operator", () => {
  describe("should flip operator", () => {
    it("loose equality", () => {
      shouldFlipOperator({ code: "a ==[cursor] b", expected: "b == a" });
    });

    it("strict equality", () => {
      shouldFlipOperator({ code: "a ===[cursor] b", expected: "b === a" });
    });

    it("loose inequality", () => {
      shouldFlipOperator({ code: "a !=[cursor] b", expected: "b != a" });
    });

    it("strict inequality", () => {
      shouldFlipOperator({ code: "a !==[cursor] b", expected: "b !== a" });
    });

    it("greather than", () => {
      shouldFlipOperator({ code: "a >[cursor] b", expected: "b < a" });
    });

    it("lower than", () => {
      shouldFlipOperator({ code: "a <[cursor] b", expected: "b > a" });
    });

    it("greater or equal", () => {
      shouldFlipOperator({ code: "a >=[cursor] b", expected: "b <= a" });
    });

    it("lower or equal", () => {
      shouldFlipOperator({ code: "a <=[cursor] b", expected: "b >= a" });
    });

    it("logical and", () => {
      shouldFlipOperator({ code: "a &&[cursor] b", expected: "b && a" });
    });

    it("logical or", () => {
      shouldFlipOperator({ code: "a ||[cursor] b", expected: "b || a" });
    });

    it("nested logical or, cursor on nested", () => {
      shouldFlipOperator({
        code: "a && (b ||[cursor] c)",
        expected: "a && (c || b)"
      });
    });

    it("nested logical or, cursor on wrapper", () => {
      shouldFlipOperator({
        code: "a [cursor]&& (b || c)",
        expected: "(b || c) && (a)"
      });
    });
  });

  it("should show an error message if refactoring can't be made", () => {
    const editor = new InMemoryEditor(`a in[cursor] b`);
    const result = flipOperator({
      state: "new",
      code: editor.code,
      selection: editor.selection
    });

    expect(result.action).toBe("show error");
  });
});

function shouldFlipOperator({
  code,
  expected
}: {
  code: Code;
  expected: Code;
}) {
  const editor = new InMemoryEditor(code);
  const result = flipOperator({
    state: "new",
    code: editor.code,
    selection: editor.selection
  });

  expect(result).toMatchObject({ action: "write", code: expected });
}
