import { ErrorReason, Code } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { addBracesToArrowFunction } from "./add-braces-to-arrow-function";

describe("Add Braces to Arrow Function", () => {
  testEach<{ code: Code; expected: Code }>(
    "should add braces to arrow function",
    [
      {
        description: "basic scenario",
        code: `const sayHello = [cursor]() => "Hello!";`,
        expected: `const sayHello = () => {
  return "Hello!";
};`
      },
      {
        description: "nested arrow function, cursor on wrapper",
        code: `const createSayHello = [cursor]() => () => "Hello!";`,
        expected: `const createSayHello = () => {
  return () => "Hello!";
};`
      },
      {
        description: "nested arrow function, cursor on nested",
        code: `const createSayHello = () => [cursor]() => "Hello!";`,
        expected: `const createSayHello = () => () => {
  return "Hello!";
};`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await addBracesToArrowFunction(editor);

      expect(editor.code).toBe(expected);
    }
  );

  it("should throw an error if can't find an arrow function", async () => {
    const code = `function getTotal() {
  [cursor]return fees * 10;
}`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await addBracesToArrowFunction(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindArrowFunctionToAddBraces
    );
  });

  it("should throw an error if arrow function already has braces", async () => {
    const code = `const sayHello = () => {
  [cursor]return "Hello!";
}`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await addBracesToArrowFunction(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindArrowFunctionToAddBraces
    );
  });
});
