import { ErrorReason, Code } from "../../../editor/editor";
import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { testEach } from "../../../tests-helpers";

import { addBracesToJsxAttribute } from "./add-braces-to-jsx-attribute";

describe("Add Braces to JSX Attribute", () => {
  testEach<{ code: Code; expected: Code }>(
    "should add braces to JSX attribute",
    [
      {
        description: "basic scenario",
        code: `<TestComponent testProp=[cursor]"test" />`,
        expected: `<TestComponent testProp={"test"} />`
      },
      {
        description: "cursor on the JSX identifier",
        code: `<TestComponent te[cursor]stProp="test" />`,
        expected: `<TestComponent testProp={"test"} />`
      },
      {
        description: "with multiple jsx attributes selecting the first one",
        code: `<TestComponent firstProp="firs[cursor]t" secondProp="second" />`,
        expected: `<TestComponent firstProp={"first"} secondProp="second" />`
      },
      {
        description: "with multiple jsx attributes selecting the second one",
        code: `<TestComponent firstProp="first" secondProp="s[cursor]econd" />`,
        expected: `<TestComponent firstProp="first" secondProp={"second"} />`
      },
      {
        description: "function component",
        code: `function TestComponent() {
  return (
    <section>
      <TestComponent testProp="t[cursor]est" />
    </section>
  );
}`,
        expected: `function TestComponent() {
  return (
    <section>
      <TestComponent testProp={"test"} />
    </section>
  );
}`
      },
      {
        description: "JSX attribute already a JSX expression",
        code: `<TestComponent testProp=[cursor]{"test"} />`,
        expected: `<TestComponent testProp={"test"} />`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await addBracesToJsxAttribute(editor);

      expect(editor.code).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await addBracesToJsxAttribute(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindJsxAttributeToAddBracesTo
    );
  });
});
