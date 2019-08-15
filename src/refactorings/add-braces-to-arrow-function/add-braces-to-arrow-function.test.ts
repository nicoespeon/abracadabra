import { Selection } from "../../editor/selection";
import { Editor, ErrorReason, Code } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { addBracesToArrowFunction } from "./add-braces-to-arrow-function";

describe("Add Braces to Arrow Function", () => {
  let showErrorMessage: Editor["showError"];

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; selection: Selection; expected: Code }>(
    "should add braces to arrow function",
    [
      {
        description: "basic scenario",
        code: `const sayHello = () => "Hello!";`,
        selection: Selection.cursorAt(0, 17),
        expected: `const sayHello = () => {
  return "Hello!";
};`
      },
      {
        description: "nested arrow function, cursor on wrapper",
        code: `const createSayHello = () => () => "Hello!";`,
        selection: Selection.cursorAt(0, 23),
        expected: `const createSayHello = () => {
  return () => "Hello!";
};`
      },
      {
        description: "nested arrow function, cursor on nested",
        code: `const createSayHello = () => () => "Hello!";`,
        selection: Selection.cursorAt(0, 29),
        expected: `const createSayHello = () => () => {
  return "Hello!";
};`
      }
    ],
    async ({ code, selection, expected }) => {
      const result = await doAddBracesToArrowFunction(code, selection);

      expect(result).toBe(expected);
    }
  );

  it("should throw an error if can't find an arrow function", async () => {
    const code = `function getTotal() {
  return fees * 10;
}`;
    const selection = Selection.cursorAt(1, 2);

    await doAddBracesToArrowFunction(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundArrowFunctionToAddBraces
    );
  });

  it("should throw an error if arrow function already has braces", async () => {
    const code = `const sayHello = () => {
  return "Hello!";
}`;
    const selection = Selection.cursorAt(1, 2);

    await doAddBracesToArrowFunction(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundArrowFunctionToAddBraces
    );
  });

  async function doAddBracesToArrowFunction(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const editor = new InMemoryEditor(code);
    editor.showError = showErrorMessage;
    await addBracesToArrowFunction(code, selection, editor);
    return editor.code;
  }
});
