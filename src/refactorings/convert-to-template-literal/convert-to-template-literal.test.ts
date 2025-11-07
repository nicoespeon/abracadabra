import * as t from "../../ast";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import {
  convertToTemplateLiteral,
  createVisitor,
  isInsertingVariableInStringLiteral
} from "./convert-to-template-literal";

describe("Convert To Template Literal", () => {
  describe("should not show refactoring", () => {
    it("on an import statement using double quotes", () => {
      const code = `import MyComponent from "./MyComponent";`;
      const selection = Selection.cursorAt(0, 27);
      const ast = t.parse(code);
      let canConvert = false;
      t.traverseAST(
        ast,
        createVisitor(selection, () => (canConvert = true))
      );

      expect(canConvert).toBeFalsy();
    });

    it("on an import statement using sinle quotes", () => {
      const code = `import MyComponent from './MyComponent';`;
      const selection = Selection.cursorAt(0, 27);
      const ast = t.parse(code);
      let canConvert = false;
      t.traverseAST(
        ast,
        createVisitor(selection, () => (canConvert = true))
      );

      expect(canConvert).toBeFalsy();
    });

    it("on a concatenation (handled by VS Code)", () => {
      const code = `const name = "Jane" + 1;`;
      const selection = Selection.cursorAt(0, 17);
      const ast = t.parse(code);
      let canConvert = false;
      t.traverseAST(
        ast,
        createVisitor(selection, () => (canConvert = true))
      );

      expect(canConvert).toBeFalsy();
    });
  });

  describe("should convert to template literal", () => {
    it("a simple string", () => {
      shouldConvertToTemplateLiteral({
        code: `const name = [cursor]"Jane";`,
        expected: "const name = `Jane`;"
      });
    });

    it("only selected string", () => {
      shouldConvertToTemplateLiteral({
        code: `const name = [cursor]"Jane";
const lastName = "Doe";`,
        expected: `const name = \`Jane\`;
const lastName = "Doe";`
      });
    });

    it("JSX attribute without braces", () => {
      shouldConvertToTemplateLiteral({
        code: `<TestComponent testProp="t[cursor]est" />`,
        expected: `<TestComponent testProp={\`test\`} />`
      });
    });

    it("string literal with backticks", () => {
      shouldConvertToTemplateLiteral({
        code: "const a = 'Hello[cursor] `you`'",
        expected: "const a = `Hello \\`you\\``"
      });
    });

    it("string literal with ${value}", () => {
      shouldConvertToTemplateLiteral({
        code: "const a = 'Hello[cursor] ${you} ${me2}'",
        expected: "const a = `Hello ${you} ${me2}`"
      });
    });

    it("string literal with empty ${}", () => {
      shouldConvertToTemplateLiteral({
        code: "const a = 'Hello[cursor] ${}'",
        expected: "const a = `Hello ${}`"
      });
    });

    it("preserves comments", () => {
      shouldConvertToTemplateLiteral({
        code: `const name =
  // leading comment
  [cursor]"Jane"
  // trailing comment
  ;`,
        expected: `const name =
  // leading comment
  \`Jane\`
  // trailing comment
  ;`
      });
    });
  });

  describe("should not convert", () => {
    it("other binary expression operators", () => {
      shouldNotConvert(`const name = "[cursor]Jane-" - 12 + "Doe";`);
    });

    it("binary expression without string", () => {
      shouldNotConvert("const total = [cursor]price + 10 + 20;");
    });

    it("concatenation (handled by VS Code)", () => {
      shouldNotConvert(`const name = "[cursor]Jane-" + 1;`);
    });

    it("import statement", () => {
      shouldNotConvert(`import MyCompo[cursor]nent from "./MyComponent"`);
    });
  });

  it("should preserve cursor position when it converts a JSX prop", () => {
    const editor = new InMemoryEditor(
      `<TestComponent testProp="t[cursor]est" />`
    );
    const result = convertToTemplateLiteral({
      state: "new",
      code: editor.code,
      selection: editor.selection,
      highlightSources: []
    });

    const expectedEditor = new InMemoryEditor(
      `<TestComponent testProp={\`t[cursor]est\`} />`
    );
    expect(result).toMatchObject({
      action: "write",
      code: expectedEditor.code,
      newCursorPosition: expectedEditor.selection.start
    });
  });

  it("should show an error message if refactoring can't be made", () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    const result = convertToTemplateLiteral({
      state: "new",
      code: editor.code,
      selection: editor.selection,
      highlightSources: []
    });

    expect(result.action).toBe("show error");
  });

  describe("isInsertingVariableInStringLiteral", () => {
    it("should return true if selection is inside a ${} in a string literal", () => {
      const editor = new InMemoryEditor(`const name = "Hello $\{[cursor]}";`);

      const result = isInsertingVariableInStringLiteral(
        editor.code,
        editor.selection
      );

      expect(result).toBeTruthy();
    });

    it("should return true if selection is inside a ${} in a string with single-quote", () => {
      const editor = new InMemoryEditor(`const name = 'Hello $\{[cursor]}';`);

      const result = isInsertingVariableInStringLiteral(
        editor.code,
        editor.selection
      );

      expect(result).toBeTruthy();
    });

    it("should return false if selection after a ${ without a closing }", () => {
      const editor = new InMemoryEditor(`const name = "Hello $\{[cursor]";`);

      const result = isInsertingVariableInStringLiteral(
        editor.code,
        editor.selection
      );

      expect(result).toBeFalsy();
    });

    it("should return false if selection is not inside a ${}", () => {
      const editor = new InMemoryEditor(`const name = "He[cursor]llo $\{}";`);

      const result = isInsertingVariableInStringLiteral(
        editor.code,
        editor.selection
      );

      expect(result).toBeFalsy();
    });

    it("should return false if selection is invalid", () => {
      const code = `const name = "Hello $\{}";`;
      const selection = Selection.cursorAt(12345, 6789);

      const result = isInsertingVariableInStringLiteral(code, selection);

      expect(result).toBeFalsy();
    });
  });
});

function shouldConvertToTemplateLiteral({
  code,
  expected
}: {
  code: Code;
  expected: Code;
}) {
  const editor = new InMemoryEditor(code);
  const result = convertToTemplateLiteral({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });

  expect(result).toMatchObject({ action: "write", code: expected });
}

function shouldNotConvert(code: Code) {
  const editor = new InMemoryEditor(code);
  const result = convertToTemplateLiteral({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });

  expect(result.action).toBe("show error");
}
