import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code } from "../../editor/editor";
import { flipTernary } from "./flip-ternary";

describe("Flip Ternary", () => {
  describe("should flip ternary", () => {
    it("basic scenario", () => {
      shouldFlipTernary({
        code: `const hello = is[cursor]Morning ? "Good morning" : "Hello";`,
        expected: `const hello = !isMorning ? "Hello" : "Good morning";`
      });
    });

    it("an already flipped ternary", () => {
      shouldFlipTernary({
        code: `const hello = !i[cursor]sMorning ? "Hello" : "Good morning";`,
        expected: `const hello = isMorning ? "Good morning" : "Hello";`
      });
    });

    it("a ternary with a binary expression", () => {
      shouldFlipTernary({
        code: `const max = a > [cursor]b ? a : b;`,
        expected: `const max = a <= b ? b : a;`
      });
    });

    it("nested, cursor on wrapper", () => {
      shouldFlipTernary({
        code: `const hello = is[cursor]Morning
  ? isMonday ? "Good monday morning!" : "Good morning"
  : "Hello";`,
        expected: `const hello = !isMorning
  ? "Hello"
  : isMonday ? "Good monday morning!" : "Good morning";`
      });
    });

    it("nested, cursor on nested", () => {
      shouldFlipTernary({
        code: `const hello = isMorning
  ? isMonday ?[cursor] "Good monday morning!" : "Good morning"
  : "Hello";`,
        expected: `const hello = isMorning
  ? !isMonday ? "Good morning" : "Good monday morning!"
  : "Hello";`
      });
    });

    it("with instanceof operator", () => {
      shouldFlipTernary({
        code: `const hello = day inst[cursor]anceof Morning ? "Good morning" : "Hello";`,
        expected: `const hello = !(day instanceof Morning) ? "Hello" : "Good morning";`
      });
    });
  });

  it("should show an error message if selection has no ternary", () => {
    const code = `console.log("no ternary")`;
    const editor = new InMemoryEditor(code);
    const result = flipTernary({
      state: "new",
      code: editor.code,
      selection: editor.selection
    });

    expect(result.action).toBe("show error");
  });
});

function shouldFlipTernary({ code, expected }: { code: Code; expected: Code }) {
  const editor = new InMemoryEditor(code);
  const result = flipTernary({
    state: "new",
    code: editor.code,
    selection: editor.selection
  });

  expect(result).toMatchObject({ action: "write", code: expected });
}
