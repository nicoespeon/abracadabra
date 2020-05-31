import { Editor, ErrorReason, Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { convertLetToConst } from "./convert-let-to-const";

describe("Convert Let To Const", () => {
  let showErrorMessage: Editor["showError"];

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; selection?: Selection; expected: Code }>(
    "should convert let to const",
    [
      {
        description: "non-mutated variable, not declared in a block",
        code: `let someVariable = 'value';`,
        expected: `const someVariable = 'value';`
      },
      {
        description: "non-mutated variable declared in a block",
        code: `{
  let someVariable = 'value';
}`,
        expected: `{
  const someVariable = 'value';
}`
      },
      {
        description: "multiple non-mutated variables declared together",
        code: `{
  let someVariable, otherVariable = 'value';
}`,
        expected: `{
  const someVariable, otherVariable = 'value';
}`
      },
      {
        description: "multiple non-mutated variables delcared seperately",
        code: `{
  let someVariable = 'someValue';
  let otherVariable = 'otherValue';
}`,
        expected: `{
  const someVariable = 'someValue';
  let otherVariable = 'otherValue';
}`
      },
      {
        description:
          "multiple variables delcared seperately, other one mutated",
        code: `{
  let someVariable = 'someValue';
  let otherVariable = 'otherValue';
  otherVariable = 'newValue';
}`,
        expected: `{
  const someVariable = 'someValue';
  let otherVariable = 'otherValue';
  otherVariable = 'newValue';
}`
      }
    ],
    async ({ code, selection = Selection.cursorAt(0, 0), expected }) => {
      const result = await doConvertLetToConst(code, selection);

      expect(result).toBe(expected);
    }
  );

  testEach<{ code: Code; selection?: Selection }>(
    "should not convert",
    [
      {
        description: "already a const",
        code: `{
  const someVariable = 'value';
}`
      },
      {
        description: "variable delcared as var",
        code: `{
  var someVariable = 'value';
}`
      },
      {
        description: "mutated variable in a block",
        code: `{
  let someVariable = 'value';
  someVariable = 'anotherValue';
}`
      },
      {
        description: "mutated variable in a different scope",
        code: `let someVariable = 'value'; 
{
  someVariable = 'anotherValue';
}`
      },
      {
        description: "mutated variable not in a block",
        code: `let someVariable = 'value';
  someVariable = 'anotherValue';`
      },
      {
        description:
          "two variables declared on same line, first mutated, second not",
        code: `{
  let someVariable, otherVariable = 'value';
  someVariable = 'anotherValue';
}`
      },
      {
        description:
          "two variables declared on same line, second mutated, first not",
        code: `{
  let someVariable, otherVariable = 'value';
  otherVariable = 'anotherValue';
}`
      },
      {
        description: "multiple variables, one mutated, one not",
        code: `{
  let someVariable = 'someValue';
  let otherVariable = 'otherValue';
  someVariable = 'newValue';
}`
      }
    ],
    async ({ code, selection = Selection.cursorAt(0, 0) }) => {
      const result = await doConvertLetToConst(code, selection);

      expect(result).toBe(code);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const selection = Selection.cursorAt(0, 0);

    await doConvertLetToConst(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFindLetToConvertToConst
    );
  });

  async function doConvertLetToConst(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const editor = new InMemoryEditor(code);
    editor.showError = showErrorMessage;
    await convertLetToConst(code, selection, editor);
    return editor.code;
  }
});
