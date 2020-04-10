import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";
import * as t from "../../ast";
import {
  convertToTemplateLiteral,
  canConvertToTemplateLiteral
} from "./convert-to-template-literal";

describe("Convert To Template Literal", () => {
  let showErrorMessage: Editor["showError"];

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

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
        canConvertToTemplateLiteral(selection, () => (canConvert = true))
      );

      expect(canConvert).toBeFalsy();
    }
  );

  testEach<{ code: Code; selection?: Selection; expected: Code }>(
    "should convert to template literal",
    [
      {
        description: "a simple string",
        code: `const name = "Jane";`,
        expected: "const name = `Jane`;"
      },
      {
        description: "only selected string",
        code: `const name = "Jane";
const lastName = "Doe";`,
        expected: `const name = \`Jane\`;
const lastName = "Doe";`
      },
      {
        description: "JSX attribute without braces",
        code: `<TestComponent testProp="test" />`,
        selection: Selection.cursorAt(0, 26),
        expected: `<TestComponent testProp={\`test\`} />`
      }
    ],
    async ({ code, selection = Selection.cursorAt(0, 13), expected }) => {
      const result = await doConvertToTemplateLiteral(code, selection);

      expect(result).toBe(expected);
    }
  );

  testEach<{ code: Code; selection?: Selection }>(
    "should not convert",
    [
      {
        description: "other binary expression operators",
        code: `const name = "Jane-" - 12 + "Doe";`
      },
      {
        description: "binary expression without string",
        code: "const total = price + 10 + 20;"
      },
      {
        description: "concatenation (handled by VS Code)",
        code: `const name = "Jane-" + 1;`
      },
      {
        description: "import statement",
        code: `import MyComponent from "./MyComponent"`
      }
    ],
    async ({ code, selection = Selection.cursorAt(0, 14) }) => {
      const result = await doConvertToTemplateLiteral(code, selection);

      expect(result).toBe(code);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const selection = Selection.cursorAt(0, 0);

    await doConvertToTemplateLiteral(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFindStringToConvert
    );
  });

  async function doConvertToTemplateLiteral(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const editor = new InMemoryEditor(code);
    editor.showError = showErrorMessage;
    await convertToTemplateLiteral(code, selection, editor);
    return editor.code;
  }
});
