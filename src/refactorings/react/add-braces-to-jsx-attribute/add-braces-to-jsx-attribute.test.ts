import { Editor, ErrorReason, Code } from "../../../editor/editor";
import { Selection } from "../../../editor/selection";
import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { testEach } from "../../../tests-helpers";

import { addBracesToJsxAttribute } from "./add-braces-to-jsx-attribute";

describe("Add Braces To Jsx Attribute", () => {
  let showErrorMessage: Editor["showError"];

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; selection?: Selection; expected: Code }>(
    "should add braces to jsx attribute",
    [
      {
        description: "basic scenario",
        code: `<TestComponent testProp="test" />`,
        selection: Selection.cursorAt(0, 24),
        expected: `<TestComponent testProp={"test"} />`
      },
      {
        description: "cursor on the JSX identifier",
        code: `<TestComponent testProp="test" />`,
        selection: Selection.cursorAt(0, 17),
        expected: `<TestComponent testProp={"test"} />`
      },
      {
        description: "with multiple jsx attributes selecting the first one",
        code: `<TestComponent firstProp="first" secondProp="second" />`,
        selection: Selection.cursorAt(0, 30),
        expected: `<TestComponent firstProp={"first"} secondProp="second" />`
      },
      {
        description: "with multiple jsx attributes selecting the second one",
        code: `<TestComponent firstProp="first" secondProp="second" />`,
        selection: Selection.cursorAt(0, 46),
        expected: `<TestComponent firstProp="first" secondProp={"second"} />`
      },
      {
        description: "function component",
        code: `function TestComponent() {
          return (
            <section>
              <TestComponent testProp="test" />
            </section>
          );
        }`,
        selection: Selection.cursorAt(3, 40),
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
        code: `<TestComponent testProp={"test"} />`,
        selection: Selection.cursorAt(0, 24),
        expected: `<TestComponent testProp={"test"} />`
      }
    ],
    async ({ code, selection = Selection.cursorAt(0, 0), expected }) => {
      const result = await doAddBracesToJsxAttribute(code, selection);

      expect(result).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const selection = Selection.cursorAt(0, 0);

    await doAddBracesToJsxAttribute(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundJsxAttributeToAddBracesTo
    );
  });

  async function doAddBracesToJsxAttribute(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const editor = new InMemoryEditor(code);
    editor.showError = showErrorMessage;
    await addBracesToJsxAttribute(code, selection, editor);
    return editor.code;
  }
});
