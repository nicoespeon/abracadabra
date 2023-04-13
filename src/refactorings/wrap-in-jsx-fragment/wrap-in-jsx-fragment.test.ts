import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code, ErrorReason } from "../../editor/editor";
import { testEach } from "../../tests-helpers";
import { wrapInJsxFragment } from "./wrap-in-jsx-fragment";

describe("Wrap In JSX Fragment", () => {
  testEach<{ code: Code; expected: Code }>(
    "should wrap in JSX fragment",
    [
      {
        description: "a regular JSX div",
        code: `return <div>[cursor]Something witty goes here</div>;`,
        expected: `return <><div>Something witty goes here</div></>;`
      },
      {
        description: "a regular JSX div, cursor within content",
        code: `return <div>Something witty[cursor] goes here</div>;`,
        expected: `return <><div>Something witty goes here</div></>;`
      },
      {
        description: "nested JSX elements, cursor on wrapper",
        code: `return <div[cursor]><span>Something witty goes here</span></div>;`,
        expected: `return <><div><span>Something witty goes here</span></div></>;`
      },
      {
        description: "nested JSX elements, cursor on nested",
        code: `return <div><span[cursor]>Something witty goes here</span></div>;`,
        expected: `return <div><><span>Something witty goes here</span></></div>;`
      },
      {
        description: "parenthesized, returned JSX",
        code: `return ([cursor]<div>Something witty goes here</div>);`,
        expected: `return (<><div>Something witty goes here</div></>);`
      },
      {
        description: "nested return statement, cursor on nested",
        code: `const arr = new Array(4).fill(0);
return <div>{arr.map(el => {
  return <p[cursor]>{el}</p>;
})}</div>;`,
        expected: `const arr = new Array(4).fill(0);
return (
  <div>{arr.map(el => {
    return <><p>{el}</p></>;
  })}</div>
);`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await wrapInJsxFragment(editor);

      expect(editor.code).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await wrapInJsxFragment(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.CouldNotWrapInJsxFragment
    );
  });
});
