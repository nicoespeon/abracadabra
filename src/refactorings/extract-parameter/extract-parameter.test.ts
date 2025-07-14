import { describe } from "node:test";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { extractParameter } from "./extract-parameter";

describe("Extract Parameter", () => {
  describe("should convert a const to a parameter with default value", () => {
    it("named function", () => {
      shouldExtractParameter({
        code: `function sayHello() {
  const name[cursor] = "World";
  const lastName = "Doe";
}`,
        expected: `function sayHello(name = "World") {
  const lastName = "Doe";
}`
      });
    });

    it("anonymous function", () => {
      shouldExtractParameter({
        code: `const sayHello = function() {
  const name[cursor] = "World";
  const lastName = "Doe";
}`,
        expected: `const sayHello = function(name = "World") {
  const lastName = "Doe";
}`
      });
    });

    it("arrow function", () => {
      shouldExtractParameter({
        code: `const sayHello = () => {
  const name[cursor] = "World";
  const lastName = "Doe";
}`,
        expected: `const sayHello = (name = "World") => {
  const lastName = "Doe";
}`
      });
    });

    it("array deconstruction", () => {
      shouldExtractParameter({
        code: `const sayHello = () => {
  const [first, ...rest][cursor] = ["Hello", "World"];
  const lastName = "Doe";
}`,
        expected: `const sayHello = ([first, ...rest] = ["Hello", "World"]) => {
  const lastName = "Doe";
}`
      });
    });

    it("nested function", () => {
      shouldExtractParameter({
        code: `function main() {
  function sayHello() {
    const name[cursor] = "World";
    const lastName = "Doe";
  }
}`,
        expected: `function main() {
  function sayHello(name = "World") {
    const lastName = "Doe";
  }
}`
      });
    });

    it("nested arrow function", () => {
      shouldExtractParameter({
        code: `const main = () => {
  const sayHello = () => {
    const name[cursor] = "World";
    const lastName = "Doe";
  }
}`,
        expected: `const main = () => {
  const sayHello = (name = "World") => {
    const lastName = "Doe";
  }
}`
      });
    });

    it("function with existing parameters", () => {
      shouldExtractParameter({
        code: `function sayHello(pronoun) {
  const name[cursor] = "World";
  const lastName = "Doe";
}`,
        expected: `function sayHello(pronoun, name = "World") {
  const lastName = "Doe";
}`
      });
    });

    it("object method", () => {
      shouldExtractParameter({
        code: `const obj = {
  sayHello() {
    const name[cursor] = "World";
    const lastName = "Doe";
  }
}`,
        expected: `const obj = {
  sayHello(name = "World") {
    const lastName = "Doe";
  }
}`
      });
    });

    it("class method", () => {
      shouldExtractParameter({
        code: `class SomeClass {
  public sayHello() {
    const name[cursor] = "World";
    const lastName = "Doe";
  }
}`,
        expected: `class SomeClass {
  public sayHello(name = "World") {
    const lastName = "Doe";
  }
}`
      });
    });

    it("class method (private)", () => {
      shouldExtractParameter({
        code: `class SomeClass {
  #sayHello() {
    const name[cursor] = "World";
    const lastName = "Doe";
  }
}`,
        expected: `class SomeClass {
  #sayHello(name = "World") {
    const lastName = "Doe";
  }
}`
      });
    });
  });

  describe("should show an error message if refactoring can't be made", () => {
    it("variable declaration outside of a function", () => {
      const code = `const name = "World";`;

      const result = extractParameter({
        state: "new",
        code,
        selection: Selection.cursorAt(0, 0)
      });

      expect(result.action).toBe("show error");
    });

    it("let without assignation", () => {
      const code = `const sayHello = () => {
  let name;
}`;

      const result = extractParameter({
        state: "new",
        code,
        selection: Selection.cursorAt(1, 9)
      });

      expect(result.action).toBe("show error");
    });
  });
});

function shouldExtractParameter({
  code,
  expected
}: {
  code: Code;
  expected: Code;
}) {
  const editor = new InMemoryEditor(code);

  const result = extractParameter({
    state: "new",
    code: editor.code,
    selection: editor.selection
  });

  expect(result).toMatchObject({ action: "write", code: expected });
}
