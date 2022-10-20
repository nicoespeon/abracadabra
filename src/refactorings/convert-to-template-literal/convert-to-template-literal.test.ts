import { Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";
import * as t from "../../ast";
import {
  convertToTemplateLiteral,
  createVisitor
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

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await convertToTemplateLiteral(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindStringToConvert
    );
  });
});
