import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code } from "../../editor/editor";
import { removeJsxFragment } from "./remove-jsx-fragment";

describe("Remove JSX Fragment", () => {
  describe("should remove JSX fragment", () => {
    it("a single div inside JSX", () => {
      shouldRemoveJsxFragment({
        code: "return <><div>[cursor]I'm a mere div</div></>;",
        expected: "return <div>I'm a mere div</div>;"
      });
    });

    it("a div with multiple children inside JSX", () => {
      shouldRemoveJsxFragment({
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
      });
    });

    it("the closest unnecessary JSX Fragment", () => {
      shouldRemoveJsxFragment({
        code: `return (<>
  <div>
    <h2>I'm a heading</h2>
    <><p>[cursor]I'm just a paragraph</p></>
  </div>
</>);`,
        expected: `return (
  <>
    <div>
      <h2>I'm a heading</h2>
      <p>I'm just a paragraph</p>
    </div>
  </>
);`
      });
    });
  });

  it("should not remove JSX Fragment if it has 2+ children", () => {
    const code = `return <><div>Something</div>[cursor]<div>Something else</div></>`;
    const editor = new InMemoryEditor(code);
    const result = removeJsxFragment({
      state: "new",
      code: editor.code,
      selection: editor.selection,
      highlightSources: []
    });

    expect(result.action).toBe("show error");
  });

  it("should show an error message if refactoring can't be made", () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    const result = removeJsxFragment({
      state: "new",
      code: editor.code,
      selection: editor.selection,
      highlightSources: []
    });

    expect(result.action).toBe("show error");
  });
});

function shouldRemoveJsxFragment({
  code,
  expected
}: {
  code: Code;
  expected: Code;
}) {
  const editor = new InMemoryEditor(code);
  const result = removeJsxFragment({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });

  expect(result).toMatchObject({ action: "write", code: expected });
}
