import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code } from "../../editor/editor";
import { wrapInJsxFragment } from "./wrap-in-jsx-fragment";

describe("Wrap In JSX Fragment", () => {
  describe("should wrap in JSX fragment", () => {
    it("a regular JSX div", () => {
      shouldWrapInJsxFragment({
        code: `return <div>[cursor]Something witty goes here</div>;`,
        expected: `return <><div>Something witty goes here</div></>;`
      });
    });

    it("a regular JSX div, cursor within content", () => {
      shouldWrapInJsxFragment({
        code: `return <div>Something witty[cursor] goes here</div>;`,
        expected: `return <><div>Something witty goes here</div></>;`
      });
    });

    it("nested JSX elements, cursor on wrapper", () => {
      shouldWrapInJsxFragment({
        code: `return <div[cursor]><span>Something witty goes here</span></div>;`,
        expected: `return <><div><span>Something witty goes here</span></div></>;`
      });
    });

    it("nested JSX elements, cursor on nested", () => {
      shouldWrapInJsxFragment({
        code: `return <div><span[cursor]>Something witty goes here</span></div>;`,
        expected: `return <div><><span>Something witty goes here</span></></div>;`
      });
    });

    it("parenthesized, returned JSX", () => {
      shouldWrapInJsxFragment({
        code: `return ([cursor]<div>Something witty goes here</div>);`,
        expected: `return (<><div>Something witty goes here</div></>);`
      });
    });

    it("nested return statement, cursor on nested", () => {
      shouldWrapInJsxFragment({
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
      });
    });
  });

  it("should show an error message if refactoring can't be made", () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    const result = wrapInJsxFragment({
      state: "new",
      code: editor.code,
      selection: editor.selection,
      highlightSources: []
    });

    expect(result.action).toBe("show error");
  });
});

function shouldWrapInJsxFragment({
  code,
  expected
}: {
  code: Code;
  expected: Code;
}) {
  const editor = new InMemoryEditor(code);
  const result = wrapInJsxFragment({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });

  expect(result).toMatchObject({ action: "write", code: expected });
}
