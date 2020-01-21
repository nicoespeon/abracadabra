import { Editor, ErrorReason, Code } from "../../../editor/editor";
import { Selection } from "../../../editor/selection";
import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { testEach } from "../../../tests-helpers";

import { removeBracesFromJsxAttribute } from "./remove-braces-from-jsx-attribute";

describe("Remove Braces From JSX Attribute", () => {
  let showErrorMessage: Editor["showError"];

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; selection?: Selection; expected: Code }>(
    "should remove braces from jsx attribute",
    [
      {
        description: "basic scenario",
        code: `<TestComponent testProp={"test"} />`,
        selection: Selection.cursorAt(0, 24),
        expected: `<TestComponent testProp="test" />`
      },
      {
        description: "JSX attribute with single quote",
        code: `<TestComponent testProp={'test'} />`,
        selection: Selection.cursorAt(0, 24),
        expected: `<TestComponent testProp="test" />`
      },
      {
        description: "multiple JSX attributes, cursor on first attribute",
        code: `<TestComponent firstProp={'test'} secondProp={'test'} />`,
        selection: Selection.cursorAt(0, 27),
        expected: `<TestComponent firstProp="test" secondProp={'test'} />`
      },
      {
        description: "multiple JSX attributes, cursor on second attribute",
        code: `<TestComponent firstProp={'test'} secondProp={'test'} />`,
        selection: Selection.cursorAt(0, 48),
        expected: `<TestComponent firstProp={'test'} secondProp="test" />`
      },
      {
        description: "function component",
        code: `function TestComponent() {
          return (
            <section>
              <TestComponent testProp={'test'} />
            </section>
          );
        }`,
        selection: Selection.cursorAt(3, 40),
        expected: `function TestComponent() {
          return (
            <section>
              <TestComponent testProp="test" />
            </section>
          );
        }`
      }
    ],
    async ({ code, selection = Selection.cursorAt(0, 0), expected }) => {
      const result = await doRemoveBracesFromJsxAttribute(code, selection);
      expect(result).toBe(expected);
    }
  );

  testEach<{ code: Code; selection?: Selection }>(
    "should not change",
    [
      {
        description: "JSX attribute already containing a string literal",
        code: `<TestComponent testProp="test" />`,
        selection: Selection.cursorAt(0, 24)
      },
      {
        description: "JSX expression that is a function",
        code: `<TestComponent testProp={function() { /* should not be replaced */ }} />`,
        selection: Selection.cursorAt(0, 24)
      },
      {
        description: "JSX epxression that is an arrow function",
        code: `<TestComponent testProp={() => { /* should not be replaced */ }} />`,
        selection: Selection.cursorAt(0, 24)
      },
      {
        description: "JSX expression that is an object",
        code: `<TestComponent testProp={{ should: 'not', be: 'replaced' }} />`,
        selection: Selection.cursorAt(0, 24)
      },
      {
        description:
          "string expression not in JSX attribute should not be replaced",
        code: `function TestComponent() {
          return (
            <section>
              {'test'}
              <TestComponent />
            </section>
          );
        }`,
        selection: Selection.cursorAt(3, 8)
      }
    ],
    async ({ code, selection = Selection.cursorAt(0, 0) }) => {
      const result = await doRemoveBracesFromJsxAttribute(code, selection);
      expect(result).toBe(code);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const selection = Selection.cursorAt(0, 0);

    await doRemoveBracesFromJsxAttribute(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundBracesToRemove
    );
  });

  async function doRemoveBracesFromJsxAttribute(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const editor = new InMemoryEditor(code);
    editor.showError = showErrorMessage;
    await removeBracesFromJsxAttribute(code, selection, editor);
    return editor.code;
  }
});
