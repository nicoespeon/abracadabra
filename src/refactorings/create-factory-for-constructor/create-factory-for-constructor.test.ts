import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code } from "../../editor/editor";
import { createFactoryForConstructor } from "./create-factory-for-constructor";

describe("Create Factory For Constructor", () => {
  describe("should create factory for constructor", () => {
    it("simple constructor, no parameter", () => {
      shouldCreateFactory({
        code: `class Employee {
  constructor () {}
}`,
        expected: `class Employee {
  constructor () {}
}

function createEmployee() {
  return new Employee();
}`
      });
    });

    it("constructor with simple parameters", () => {
      shouldCreateFactory({
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
      });
    });

    it("constructor with complicated parameters", () => {
      shouldCreateFactory({
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
      });
    });

    it("constructor with typed parameters", () => {
      shouldCreateFactory({
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
      });
    });

    it("exported class", () => {
      shouldCreateFactory({
        code: `export class Employee {[cursor]
  constructor () {}
}`,
        expected: `export class Employee {
  constructor () {}
}

export function createEmployee() {
  return new Employee();
}`
      });
    });

    it("exported class, cursor on export", () => {
      shouldCreateFactory({
        code: `ex[cursor]port class Employee {
  constructor () {}
}`,
        expected: `export class Employee {
  constructor () {}
}

export function createEmployee() {
  return new Employee();
}`
      });
    });
  });

  it("should show an error message if refactoring can't be made", () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    const result = createFactoryForConstructor({
      state: "new",
      code: editor.code,
      selection: editor.selection
    });

    expect(result.action).toBe("show error");
  });
});

function shouldCreateFactory({
  code,
  expected
}: {
  code: Code;
  expected: Code;
}) {
  const editor = new InMemoryEditor(code);
  const result = createFactoryForConstructor({
    state: "new",
    code: editor.code,
    selection: editor.selection
  });

  expect(result).toMatchObject({ action: "write", code: expected });
}
