import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code, ErrorReason } from "../../editor/editor";
import { testEach } from "../../tests-helpers";
import { removeJsxFragment } from "./remove-jsx-fragment";

describe("Remove Jsx Fragment", () => {
  testEach<{ code: Code; expected: Code }>(
    "should remove jsx fragment",
    [
      {
        description: "a single div inside JSX",
        code: "return <><div>[cursor]I'm a mere div</div></>;",
        expected: "return <div>I'm a mere div</div>;"
      },
      {
        description: "a div with multiple children inside JSX",
        code: "return <><div>[cursor]<h2>I'm a heading</h2><p>I'm just a paragraph</p></div></>;",
        expected:
          "return <div><h2>I'm a heading</h2><p>I'm just a paragraph</p></div>;"
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await removeJsxFragment(editor);

      expect(editor.code).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const failingCode = [
      `// This is a comment, can't be refactored`,
      "return <><div>Something</div>[cursor]<div>Something else</div></>"
    ];
    for (const code of failingCode) {
      const editor = new InMemoryEditor(code);
      jest.spyOn(editor, "showError");

      await removeJsxFragment(editor);

      expect(editor.showError).toBeCalledWith(
        ErrorReason.DidNotRemoveJsxFragment
      );
    }
  });
});
