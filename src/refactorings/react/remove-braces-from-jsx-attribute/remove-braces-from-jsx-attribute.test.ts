import { ErrorReason, Code } from "../../../editor/editor";
import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { testEach } from "../../../tests-helpers";

import { removeBracesFromJsxAttribute } from "./remove-braces-from-jsx-attribute";

describe("Remove Braces From JSX Attribute", () => {
  testEach<{ code: Code; expected: Code }>(
    "should remove braces from jsx attribute",
    [
      {
        description: "basic scenario",
        code: `<TestComponent testProp=[cursor]{"test"} />`,
        expected: `<TestComponent testProp="test" />`
      },
      {
        description: "JSX attribute with single quote",
        code: `<TestComponent testProp=[cursor]{'test'} />`,
        expected: `<TestComponent testProp="test" />`
      },
      {
        description: "multiple JSX attributes, cursor on first attribute",
        code: `<TestComponent firstProp={'[cursor]test'} secondProp={'test'} />`,
        expected: `<TestComponent firstProp="test" secondProp={'test'} />`
      },
      {
        description: "multiple JSX attributes, cursor on second attribute",
        code: `<TestComponent firstProp={'test'} secondProp={'t[cursor]est'} />`,
        expected: `<TestComponent firstProp={'test'} secondProp="test" />`
      },
      {
        description: "function component",
        code: `function TestComponent() {
  return (
    <section>
      <TestComponent testProp={'[cursor]test'} />
    </section>
  );
}`,
        expected: `function TestComponent() {
  return (
    <section>
      <TestComponent testProp="test" />
    </section>
  );
}`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await removeBracesFromJsxAttribute(editor);

      expect(editor.code).toBe(expected);
    }
  );

  testEach<{ code: Code }>(
    "should not change",
    [
      {
        description: "JSX attribute already containing a string literal",
        code: `<TestComponent testProp=[cursor]"test" />`
      },
      {
        description: "JSX expression that is a function",
        code: `<TestComponent testProp=[cursor]{function() { /* should not be replaced */ }} />`
      },
      {
        description: "JSX epxression that is an arrow function",
        code: `<TestComponent testProp=[cursor]{() => { /* should not be replaced */ }} />`
      },
      {
        description: "JSX expression that is an object",
        code: `<TestComponent testProp=[cursor]{{ should: 'not', be: 'replaced' }} />`
      },
      {
        description:
          "string expression not in JSX attribute should not be replaced",
        code: `function TestComponent() {
  return (
    [cursor]<section>
      {'test'}
      <TestComponent />
    </section>
  );
}`
      }
    ],
    async ({ code }) => {
      const editor = new InMemoryEditor(code);
      const originalCode = editor.code;

      await removeBracesFromJsxAttribute(editor);

      expect(editor.code).toBe(originalCode);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await removeBracesFromJsxAttribute(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindBracesToRemove
    );
  });
});
