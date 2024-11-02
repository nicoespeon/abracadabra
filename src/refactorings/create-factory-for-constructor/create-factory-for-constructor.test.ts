import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code, ErrorReason } from "../../editor/editor";
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
      },
      {
        description: "constructor with complicated parameters",
        code: `class Employee {
  constructor (private name, readonly typeCode, { age }, [one], ...others) {
    this.age = age;
  }
}`,
        expected: `class Employee {
  constructor (private name, readonly typeCode, { age }, [one], ...others) {
    this.age = age;
  }
}

function createEmployee(name, typeCode, { age }, [one], ...others) {
  return new Employee(name, typeCode, {
    age
  }, [one], ...others);
}`
      },
      {
        description: "constructor with typed parameters",
        code: `class Employee {
  constructor (name: string, private typeCode: string) {
    this.name = name;
  }
}`,
        expected: `class Employee {
  constructor (name: string, private typeCode: string) {
    this.name = name;
  }
}

function createEmployee(name: string, typeCode: string) {
  return new Employee(name, typeCode);
}`
      },
      {
        description: "exported class",
        code: `export class Employee {[cursor]
  constructor () {}
}`,
        expected: `export class Employee {
  constructor () {}
}

export function createEmployee() {
  return new Employee();
}`
      },
      {
        description: "exported class, cursor on export",
        code: `ex[cursor]port class Employee {
  constructor () {}
}`,
        expected: `export class Employee {
  constructor () {}
}

export function createEmployee() {
  return new Employee();
}`
      }
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

    expect(editor.showError).toHaveBeenCalledWith(ErrorReason.DidNotFindClass);
  });
});
