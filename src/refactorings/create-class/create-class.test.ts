import { ErrorReason, Code } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { createClass } from "./create-class";

describe("Create Class", () => {
  testEach<{ code: Code; expected: Code }>(
    "should create class from undefined class",
    [
      {
        description:
          "without argument. Shoulld define class without constructor",
        code: `new MyClass()`,
        expected: "class MyClass {}\nnew MyClass()"
      },
      {
        description:
          "with string argument. Should defined a class and add it to constructor",
        code: `new MyClass("Hello")`,
        expected: `class MyClass {
  constructor(str1) {}
}

new MyClass("Hello")`
      },
      {
        description:
          "with multiple primitive arguments. Should defined a class and add it to constructor",
        code: `new MyClass("Hello", "wold", 1, 2, true, false)`,
        expected: `class MyClass {
  constructor(str1, str2, num1, num2, bool1, bool2) {}
}

new MyClass("Hello", "wold", 1, 2, true, false)`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await createClass(editor);

      expect(editor.code).toBe(expected);
    }
  );

  it("Should not create a new class if class already is defined", async () => {
    const code = `class MyClass{}
        [cursor]new MyClass();
        `;
    const expected = `class MyClass{}
        new MyClass();
        `;
    const editor = new InMemoryEditor(code);

    await createClass(editor);

    expect(editor.code).toBe(expected);
  });

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await createClass(editor);

    expect(editor.showError).toBeCalledWith(ErrorReason.CantCreateClass);
  });
});
