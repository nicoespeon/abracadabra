import { Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";
import * as t from "../../ast";
import {
  convertToTemplateLiteral,
  createVisitor,
  isInsertingVariableInStringLiteral
} from "./convert-to-template-literal";

describe("Convert To Template Literal", () => {
  testEach<{ code: Code; selection?: Selection }>(
    "should not show refactoring",
    [
      {
        description: "on an import statement using double quotes",
        code: `import MyComponent from "./MyComponent";`,
        selection: Selection.cursorAt(0, 27)
      },
      {
        description: "on an import statement using sinle quotes",
        code: `import MyComponent from './MyComponent';`,
        selection: Selection.cursorAt(0, 27)
      },
      {
        description: "on a concatenation (handled by VS Code)",
        code: `const name = "Jane" + 1;`,
        selection: Selection.cursorAt(0, 17)
      }
    ],
    ({ code, selection = Selection.cursorAt(0, 13) }) => {
      const ast = t.parse(code);
      let canConvert = false;
      t.traverseAST(
        ast,
        createVisitor(selection, () => (canConvert = true))
      );

      expect(canConvert).toBeFalsy();
    }
  );

  testEach<{ code: Code; expected: Code }>(
    "should convert to template literal",
    [
      {
        description: "a simple string",
        code: `const name = [cursor]"Jane";`,
        expected: "const name = `Jane`;"
      },
      {
        description: "only selected string",
        code: `const name = [cursor]"Jane";
const lastName = "Doe";`,
        expected: `const name = \`Jane\`;
const lastName = "Doe";`
      },
      {
        description: "JSX attribute without braces",
        code: `<TestComponent testProp="t[cursor]est" />`,
        expected: `<TestComponent testProp={\`test\`} />`
      },
      {
        description: "string literal with backticks",
        code: "const a = 'Hello[cursor] `you`'",
        expected: "const a = `Hello \\`you\\``"
      },
      {
        description: "string literal with ${value}",
        code: "const a = 'Hello[cursor] ${you} ${me2}'",
        expected: "const a = `Hello ${you} ${me2}`"
      },
      {
        description: "string literal with empty ${}",
        code: "const a = 'Hello[cursor] ${}'",
        expected: "const a = `Hello ${}`"
      },
      {
        description: "preserves comments",
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
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await convertToTemplateLiteral(editor);

      expect(editor.code).toBe(expected);
    }
  );

  testEach<{ code: Code; selection?: Selection }>(
    "should not convert",
    [
      {
        description: "other binary expression operators",
        code: `const name = "[cursor]Jane-" - 12 + "Doe";`
      },
      {
        description: "binary expression without string",
        code: "const total = [cursor]price + 10 + 20;"
      },
      {
        description: "concatenation (handled by VS Code)",
        code: `const name = "[cursor]Jane-" + 1;`
      },
      {
        description: "import statement",
        code: `import MyCompo[cursor]nent from "./MyComponent"`
      }
    ],
    async ({ code }) => {
      const editor = new InMemoryEditor(code);
      const originalCode = editor.code;

      await convertToTemplateLiteral(editor);

      expect(editor.code).toBe(originalCode);
    }
  );

  it("should preserve cursor position when it converts a JSX prop", async () => {
    const editor = new InMemoryEditor(
      `<TestComponent testProp="t[cursor]est" />`
    );

    await convertToTemplateLiteral(editor);

    const expectedEditor = new InMemoryEditor(
      `<TestComponent testProp={\`t[cursor]est\`} />`
    );
    expect(editor.code).toBe(expectedEditor.code);
    expect(editor.selection).toEqual(expectedEditor.selection);
  });

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await convertToTemplateLiteral(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindStringToConvert
    );
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
