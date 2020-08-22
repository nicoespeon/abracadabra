import { Code, ErrorReason } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { removeBracesFromArrowFunction } from "./remove-braces-from-arrow-function";

describe("Remove Braces from Arrow Function", () => {
  testEach<{ code: Code; expected: Code }>(
    "should remove braces from arrow function",
    [
      {
        description: "basic scenario",
        code: `const sayHello = () => {
  [cursor]return "Hello!";
};`,
        expected: `const sayHello = () => "Hello!";`
      },
      {
        description: "nested arrow function, cursor on wrapper",
        code: `const createSayHello = () => {
  [cursor]return () => {
    return "Hello!";
  }
};`,
        expected: `const createSayHello = () => () => {
  return "Hello!";
};`
      },
      {
        description: "nested arrow function, cursor on nested",
        code: `const createSayHello = () => {
  return () => {
    [cursor]return "Hello!";
  }
};`,
        expected: `const createSayHello = () => {
  return () => "Hello!";
};`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await removeBracesFromArrowFunction(editor);

      expect(editor.code).toBe(expected);
    }
  );

  it("should throw an error if can't find an arrow function", async () => {
    const code = `function getTotal() {
  [cursor]return fees * 10;
}`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await removeBracesFromArrowFunction(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindBracesToRemoveFromArrowFunction
    );
  });

  it("should throw an error if arrow function doesn't have braces", async () => {
    const code = `const sayHello = () => "H[cursor]ello!";`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await removeBracesFromArrowFunction(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindBracesToRemoveFromArrowFunction
    );
  });

  it("should throw an error if arrow function returns nothing", async () => {
    const code = `const sayHello = () => {
  [cursor]return;
}`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await removeBracesFromArrowFunction(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.CantRemoveBracesFromArrowFunction
    );
  });

  it("should throw an error if arrow function doesn't return", async () => {
    const code = `const sayHello = () => {
  [cursor]console.log("Hello!");
}`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await removeBracesFromArrowFunction(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.CantRemoveBracesFromArrowFunction
    );
  });

  it("should throw an error if arrow function have statements before the return statement", async () => {
    const code = `const sayHello = () => {
  [cursor]const hello = "Hello!";
  return hello;
}`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await removeBracesFromArrowFunction(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.CantRemoveBracesFromArrowFunction
    );
  });

  it("should throw an error if arrow function have statements after the return statement", async () => {
    const code = `const sayHello = () => {
  [cursor]return "Hello!";
  console.log("Some dead code");
}`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await removeBracesFromArrowFunction(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.CantRemoveBracesFromArrowFunction
    );
  });
});
