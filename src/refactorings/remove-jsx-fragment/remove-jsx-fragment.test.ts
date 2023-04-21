import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code, ErrorReason } from "../../editor/editor";
import { testEach } from "../../tests-helpers";
import { removeJsxFragment } from "./remove-jsx-fragment";

describe("Remove JSX Fragment", () => {
  testEach<{ code: Code; expected: Code }>(
    "should remove JSX fragment",
    [
      {
        description: "a single div inside JSX",
        code: "return <><div>[cursor]I'm a mere div</div></>;",
        expected: "return <div>I'm a mere div</div>;"
      },
      {
        description: "a div with multiple children inside JSX",
        code: `return (<>
  <div>
    <h2>[cursor]I'm a heading</h2>
    <p>I'm just a paragraph</p>
  </div>
</>);`,
        expected: `return (
  <div>
    <h2>I'm a heading</h2>
    <p>I'm just a paragraph</p>
  </div>
);`
      },
      {
        description: "the closest unnecessary JSX Fragment",
        code: `return (<>
  <div>
    <h2>I'm a heading</h2>
    <><p>[cursor]I'm just a paragraph</p></>
  </div>
</>);`,
        expected: `return (<>
  <div>
    <h2>I'm a heading</h2>
    <p>I'm just a paragraph</p>
  </div>
</>);`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await removeJsxFragment(editor);

      expect(editor.code).toBe(expected);
    }
  );

  it("should not remove JSX Fragment if it has 2+ children", async () => {
    const editor = new InMemoryEditor(
      `return <><div>Something</div>[cursor]<div>Something else</div></>`
    );
    const originalCode = editor.code;

    await removeJsxFragment(editor);

    expect(editor.code).toBe(originalCode);
  });

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await removeJsxFragment(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotRemoveJsxFragment
    );
  });
});
