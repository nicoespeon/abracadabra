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
  constructor(hello) {}
}

new MyClass("Hello")`
      },
      {
        description:
          "with multiple kinds of arguments. Should defined a class and add it to constructor given argument some names",
        code: `new MyClass("world", true, 1, String("helo"), Boolean(false), null, undefined, new Class(), () => {}, new Proxy({}))`,
        expected: `class MyClass {
  constructor(
    world,
    b2,
    number3,
    String4,
    Boolean5,
    param6,
    undefined7,
    Class8,
    param9,
    Proxy10
  ) {}
}

new MyClass("world", true, 1, String("helo"), Boolean(false), null, undefined, new Class(), () => {}, new Proxy({}))`
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
