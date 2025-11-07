import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { Code } from "../../../editor/editor";
import { Selection } from "../../../editor/selection";
import { extractVariable } from "./extract-variable";

describe("Extract Variable - JSX we can extract", () => {
  describe("should extract", () => {
    it("a variable in a JSX element", async () => {
      await shouldExtractVariable({
        code: `function render() {
  return <div className="text-lg font-weight-bold">
    {this.props.location.na[cursor]me}
  </div>;
}`,
        expectedCode: `function render() {
  const { name } = this.props.location;
  return <div className="text-lg font-weight-bold">
    {[cursor]name}
  </div>;
}`
      });
    });

    it("a JSXAttribute", async () => {
      await shouldExtractVariable({
        code: `function render() {
  return <Header title="Hom[cursor]e" />;
}`,
        expectedCode: `function render() {
  const home = "Home";
  return <Header title={[cursor]home} />;
}`
      });
    });

    it("a JSXAttribute, cursor on the name", async () => {
      await shouldExtractVariable({
        code: `function MyComponent() {
  return <div id[cursor]="test">Hello</div>;
}`,
        expectedCode: `function MyComponent() {
  const extracted = <div id="test">Hello</div>;
  return extracted;
}`
      });
    });

    it("a JSX element (cursor on opening tag)", async () => {
      await shouldExtractVariable({
        code: `function render() {
  return <d[cursor]iv className="text-lg font-weight-bold">
    {this.props.location.name}
  </div>;
}`,
        expectedCode: `function render() {
  const extracted = <div className="text-lg font-weight-bold">
    {this.props.location.name}
  </div>;
  return [cursor]extracted;
}`
      });
    });

    it("a JSX element (cursor on closing tag)", async () => {
      await shouldExtractVariable({
        code: `function render() {
  return <div className="text-lg font-weight-bold">
    {this.props.location.name}
  <[cursor]/div>;
}`,
        expectedCode: `function render() {
  const extracted = <div className="text-lg font-weight-bold">
    {this.props.location.name}
  </div>;
  return [cursor]extracted;
}`
      });
    });

    it("a nested JSX element", async () => {
      await shouldExtractVariable({
        code: `function render() {
  return <div className="text-lg font-weight-bold">
    <p[cursor]>{this.props.location.name}</p>
  </div>;
}`,
        expectedCode: `function render() {
  const extracted = <p>{this.props.location.name}</p>;
  return <div className="text-lg font-weight-bold">
    {[cursor]extracted}
  </div>;
}`
      });
    });

    it("a JSXText", async () => {
      await shouldExtractVariable({
        code: `const body = <div className="text-lg font-weight-bold">
  <p>Hell[cursor]o there!</p>
</div>;`,
        expectedCode: `const extracted = "Hello there!";
const body = <div className="text-lg font-weight-bold">
  <p>{[cursor]extracted}</p>
</div>;`
      });
    });

    it("a value in a JSXExpressionContainer", async () => {
      await shouldExtractVariable({
        code: `<Component
  text={getTextForPerson({
    name: "Pedro[cursor]"
  })}
/>`,
        expectedCode: `const name = "Pedro";
<Component
  text={getTextForPerson({
    name[cursor]
  })}
/>`
      });
    });

    it("a call expression in a JSX Element", async () => {
      await shouldExtractVariable({
        code: `function render() {
  return <Button onClick={this.onC[cursor]lick()} />;
}`,
        expectedCode: `function render() {
  const extracted = this.onClick();
  return <Button onClick={[cursor]extracted} />;
}`
      });
    });
  });

  it("should wrap extracted JSX element inside JSX Expression Container when inside another", async () => {
    await shouldExtractVariable({
      code: `function render() {
  return <div className="text-lg font-weight-bold">
    [cursor]<p>{name}</p>
  </div>
}`,
      expectedCode: `function render() {
  const extracted = <p>{name}</p>;
  return <div className="text-lg font-weight-bold">
    {extracted}
  </div>
}`
    });
  });

  it("should not wrap extracted JSX element inside JSX Expression Container when not inside another", async () => {
    await shouldExtractVariable({
      code: `function render() {
  return [cursor]<p>{name}</p>;
}`,
      expectedCode: `function render() {
  const extracted = <p>{name}</p>;
  return extracted;
}`
    });
  });
});

async function shouldExtractVariable({
  code,
  expectedCode
}: {
  code: Code;
  expectedCode: Code;
}) {
  const editor = new InMemoryEditor(code);
  let result = extractVariable({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });

  const responses: Array<{ id: string; type: "choice"; value: any }> = [];

  while (result.action === "ask user choice") {
    const choice = result.choices[0];

    responses.push({
      id: result.id,
      type: "choice",
      value: choice
    });

    result = extractVariable({
      state: "with user responses",
      responses,
      code: editor.code,
      selection: editor.selection,
      highlightSources: []
    });
  }

  if (result.action !== "read then write") {
    throw new Error(`Expected "read then write" but got "${result.action}"`);
  }

  const expected = new InMemoryEditor(expectedCode);

  const testEditor = new InMemoryEditor(editor.code);
  await testEditor.readThenWrite(
    result.readSelection,
    result.getModifications,
    result.newCursorPosition
  );

  expect(testEditor.code).toBe(expected.code);

  if (!expected.selection.isEqualTo(Selection.cursorAt(0, 0))) {
    expect(result).toMatchObject({
      newCursorPosition: expected.selection.start
    });
  }
}
