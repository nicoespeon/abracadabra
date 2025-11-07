import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code } from "../../editor/editor";
import { addNumericSeparator } from "./add-numeric-separator";

describe("Add Numeric Separator", () => {
  it("should add numeric separator to distinct each group", () => {
    shouldAddNumericSeparator({
      code: `console.log([cursor]1234567890)`,
      expected: `console.log(1_234_567_890)`
    });
  });

  it("should add numeric separator to the selected number only", () => {
    shouldAddNumericSeparator({
      code: `console.log([cursor]1234567890);
console.log(1234567890);`,
      expected: `console.log(1_234_567_890);
console.log(1234567890);`
    });
  });

  it("should add numeric separator to the decimal part only", () => {
    shouldAddNumericSeparator({
      code: `console.log([cursor]1234567890.9876);`,
      expected: `console.log(1_234_567_890.9876);`
    });
  });

  it("should add numeric separator to a negative numeric literal", () => {
    shouldAddNumericSeparator({
      code: `console.log(-123456[cursor]7890.9876);`,
      expected: `console.log(-1_234_567_890.9876);`
    });
  });

  it("should not change a number that has less than 3 chars", () => {
    shouldNotConvert(`console.log([cursor]123)`);
  });

  it("should show an error message if refactoring can't be made", () => {
    shouldNotConvert(`// This is a comment, can't be refactored`);
  });
});

function shouldAddNumericSeparator({
  code,
  expected
}: {
  code: Code;
  expected: Code;
}) {
  const editor = new InMemoryEditor(code);

  const result = addNumericSeparator({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });

  expect(result).toMatchObject({ action: "write", code: expected });
}

function shouldNotConvert(code: Code) {
  const editor = new InMemoryEditor(code);

  const result = addNumericSeparator({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });

  expect(result.action).toBe("show error");
}
