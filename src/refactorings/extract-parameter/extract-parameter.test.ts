import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { extractParameter } from "./extract-parameter";

describe("Extract Parameter", () => {
  it("should convert a const to a parameter with default value", () => {
    shouldExtractParameter({
      code: `function sayHello() {
  const name[cursor] = "World";
  const lastName = "Doe";
}`,
      expected: `function sayHello(name = "World") {
  const lastName = "Doe";
}`
    });
  });

  it("should show an error message if refactoring can't be made", () => {
    const code = `// This is a comment, can't be refactored`;

    const result = extractParameter({
      state: "new",
      code,
      selection: Selection.cursorAt(0, 0)
    });

    expect(result.action).toBe("show error");
  });
});

function shouldExtractParameter({
  code,
  expected
}: {
  code: Code;
  expected: Code;
}) {
  const editor = new InMemoryEditor(code);

  const result = extractParameter({
    state: "new",
    code: editor.code,
    selection: editor.selection
  });

  expect(result).toMatchObject({ action: "write", code: expected });
}
