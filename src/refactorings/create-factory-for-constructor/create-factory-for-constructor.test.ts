import { ErrorReason, Code } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { createFactoryForConstructor } from "./create-factory-for-constructor";

describe("Create Factory For Constructor", () => {
  testEach<{ code: Code; expected: Code }>(
    "should create factory for constructor",
    [
      {
        description: "simple constructor, no parameter",
        code: `class Employee {
  constructor () {}
}`,
        expected: `class Employee {
  constructor () {}
}

function createEmployee() {
  return new Employee();
}`
      },
      {
        description: "constructor with simple parameters",
        code: `class Employee {
  constructor (name, typeCode) {
    this.name = name;
    this.typeCode = typeCode;
  }
}`,
        expected: `class Employee {
  constructor (name, typeCode) {
    this.name = name;
    this.typeCode = typeCode;
  }
}

function createEmployee(name, typeCode) {
  return new Employee(name, typeCode);
}`
      }
      // TODO: other types of params
      // TODO: exported class => export factory
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await createFactoryForConstructor(editor);

      expect(editor.code).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await createFactoryForConstructor(editor);

    expect(editor.showError).toBeCalledWith(ErrorReason.DidNotFindClass);
  });
});
