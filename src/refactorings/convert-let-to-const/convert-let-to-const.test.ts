import { Editor, ErrorReason, Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { convertLetToConst } from "./convert-let-to-const";

describe("Convert let to const", () => {
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
        selection: Selection.cursorAt(0, 4),
        expected: `const someVariable = 'value';`
      },
      {
        description: "non-mutated variable declared in a block",
        code: `{
  let someVariable = 'value';
}`,
        selection: Selection.cursorAt(1, 7),
        expected: `{
  const someVariable = 'value';
}`
      },
      {
        description: "only the selected non-mutated variable",
        code: `let someVariable = 'someValue';
let otherVariable = 'otherValue';`,
        selection: Selection.cursorAt(0, 4),
        expected: `const someVariable = 'someValue';
let otherVariable = 'otherValue';`
      },
      {
        description:
          "only the selected non-mutated variable, other one is mutated",
        code: `let someVariable = 'someValue';
let otherVariable = 'otherValue';
otherVariable = 'newValue';`,
        selection: Selection.cursorAt(0, 4),
        expected: `const someVariable = 'someValue';
let otherVariable = 'otherValue';
otherVariable = 'newValue';`
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
        code: `const someVariable = 'value';`,
        selection: Selection.cursorAt(0, 6)
      },
      {
        description: "variable declared as var",
        code: `var someVariable = 'value';`,
        selection: Selection.cursorAt(0, 4)
      },
      {
        description: "mutated variable",
        code: `let someVariable = 'value';
someVariable = 'anotherValue';`,
        selection: Selection.cursorAt(0, 4)
      },
      {
        description: "mutated variable in a nested scope",
        code: `let someVariable = 'value';
{
  someVariable = 'anotherValue';
}`,
        selection: Selection.cursorAt(0, 4)
      },
      {
        description: "mutated variable in a block",
        code: `{
  let someVariable = 'value';
  someVariable = 'anotherValue';
}`,
        selection: Selection.cursorAt(1, 7)
      },
      {
        description: "multiple variables declared together",
        code: `let someVariable, otherVariable = 'value';`,
        selection: Selection.cursorAt(0, 4)
      },
      {
        description:
          "two variables declared together, first mutated, second not",
        code: `let someVariable, otherVariable = 'value';
someVariable = 'anotherValue';`,
        selection: Selection.cursorAt(0, 19)
      },
      {
        description:
          "two variables declared on same line, second mutated, first not",
        code: `let someVariable, otherVariable = 'value';
otherVariable = 'anotherValue';`,
        selection: Selection.cursorAt(0, 4)
      },
      {
        description: "multiple variables, one mutated, one not",
        code: `let someVariable = 'someValue';
let otherVariable = 'otherValue';
someVariable = 'newValue';`,
        selection: Selection.cursorAt(0, 4)
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
