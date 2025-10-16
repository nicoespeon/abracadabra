import * as t from "../../ast";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { convertLetToConst, createVisitor } from "./convert-let-to-const";

describe("Convert let to const", () => {
  describe("should convert let to const", () => {
    it("non-mutated variable, not declared in a block", () => {
      shouldConvertLetToConst({
        code: `let [cursor]someVariable = 'value';`,
        expected: `const someVariable = 'value';`
      });
    });

    it("non-mutated variable declared in a block", () => {
      shouldConvertLetToConst({
        code: `{
  let s[cursor]omeVariable = 'value';
}`,
        expected: `{
  const someVariable = 'value';
}`
      });
    });

    it("only the selected non-mutated variable", () => {
      shouldConvertLetToConst({
        code: `let [cursor]someVariable = 'someValue';
let otherVariable = 'otherValue';`,
        expected: `const someVariable = 'someValue';
let otherVariable = 'otherValue';`
      });
    });

    it("only the selected non-mutated variable, other one is mutated", () => {
      shouldConvertLetToConst({
        code: `let [cursor]someVariable = 'someValue';
let otherVariable = 'otherValue';
otherVariable = 'newValue';`,
        expected: `const someVariable = 'someValue';
let otherVariable = 'otherValue';
otherVariable = 'newValue';`
      });
    });
  });

  describe("should not convert", () => {
    it("already a const", () => {
      shouldNotConvert(`const [cursor]someVariable = 'value';`);
    });

    it("variable declared as var", () => {
      shouldNotConvert(`var [cursor]someVariable = 'value';`);
    });

    it("mutated variable", () => {
      shouldNotConvert(`let [cursor]someVariable = 'value';
someVariable = 'anotherValue';`);
    });

    it("mutated variable in a nested scope", () => {
      shouldNotConvert(`let [cursor]someVariable = 'value';
{
  someVariable = 'anotherValue';
}`);
    });

    it("mutated variable in a block", () => {
      shouldNotConvert(`{
  let s[cursor]omeVariable = 'value';
  someVariable = 'anotherValue';
}`);
    });

    it("multiple variables declared together", () => {
      shouldNotConvert(`let [cursor]someVariable, otherVariable = 'value';`);
    });

    it("two variables declared together, first mutated, second not", () => {
      shouldNotConvert(`let someVariable, o[cursor]therVariable = 'value';
someVariable = 'anotherValue';`);
    });

    it("two variables declared on same line, second mutated, first not", () => {
      shouldNotConvert(`let [cursor]someVariable, otherVariable = 'value';
otherVariable = 'anotherValue';`);
    });

    it("multiple variables, one mutated, one not", () => {
      shouldNotConvert(`let [cursor]someVariable = 'someValue';
let otherVariable = 'otherValue';
someVariable = 'newValue';`);
    });
  });

  it("should show an error message if refactoring can't be made", () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    const result = convertLetToConst({
      state: "new",
      code: editor.code,
      selection: editor.selection
    });

    expect(result.action).toBe("show error");
  });

  it("should not match a 'const' declaration", () => {
    const code = `const aVariable = "value";`;
    const editor = new InMemoryEditor(code);
    let canConvert = false;

    const ast = t.parse(code);
    t.traverseAST(
      ast,
      createVisitor(editor.selection, () => (canConvert = true))
    );

    expect(canConvert).toBeFalsy();
  });
});

function shouldConvertLetToConst({
  code,
  expected
}: {
  code: string;
  expected: string;
}) {
  const editor = new InMemoryEditor(code);
  const result = convertLetToConst({
    state: "new",
    code: editor.code,
    selection: editor.selection
  });

  expect(result).toMatchObject({ action: "write", code: expected });
}

function shouldNotConvert(code: string) {
  const editor = new InMemoryEditor(code);
  const result = convertLetToConst({
    state: "new",
    code: editor.code,
    selection: editor.selection
  });

  expect(result.action).toBe("show error");
}
