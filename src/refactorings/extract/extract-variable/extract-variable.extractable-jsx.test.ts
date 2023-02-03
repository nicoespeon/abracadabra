import { Code } from "../../../editor/editor";
import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { testEach } from "../../../tests-helpers";

import { extractVariable } from "./extract-variable";
import { Selection } from "../../../editor/selection";

describe("Extract Variable - JSX we can extract", () => {
  testEach<{
    code: Code;
    expectedCode: Code;
  }>(
    "should extract",
    [
      {
        description: "a variable in a JSX element",
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
      },
      {
        description: "a JSXAttribute",
        code: `function render() {
  return <Header title="Hom[cursor]e" />;
}`,
        expectedCode: `function render() {
  const home = "Home";
  return <Header title={[cursor]home} />;
}`
      },
      {
        description: "a JSXAttribute, cursor on the name",
        code: `function MyComponent() {
  return <div id[cursor]="test">Hello</div>;
}`,
        expectedCode: `function MyComponent() {
  const extracted = <div id="test">Hello</div>;
  return extracted;
}`
      },
      {
        description: "a JSX element (cursor on opening tag)",
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
      },
      {
        description: "a JSX element (cursor on closing tag)",
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
      },
      {
        description: "a nested JSX element",
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
      },
      {
        description: "a JSXText",
        code: `const body = <div className="text-lg font-weight-bold">
  <p>Hell[cursor]o there!</p>
</div>;`,
        expectedCode: `const extracted = "Hello there!";
const body = <div className="text-lg font-weight-bold">
  <p>{[cursor]extracted}</p>
</div>;`
      },
      {
        description: "a value in a JSXExpressionContainer",
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
      },
      {
        description: "a call expression in a JSX Element",
        code: `function render() {
  return <Button onClick={this.onC[cursor]lick()} />;
}`,
        expectedCode: `function render() {
  const extracted = this.onClick();
  return <Button onClick={[cursor]extracted} />;
}`
      }
    ],
    async ({ code, expectedCode }) => {
      const editor = new InMemoryEditor(code);

      await extractVariable(editor);

      const expected = new InMemoryEditor(expectedCode);
      expect(editor.code).toBe(expected.code);
      if (!expected.selection.isEqualTo(Selection.cursorAt(0, 0))) {
        expect(editor.selection).toStrictEqual(expected.selection);
      }
    }
  );

  it("should wrap extracted JSX element inside JSX Expression Container when inside another", async () => {
    const code = `function render() {
  return <div className="text-lg font-weight-bold">
    [cursor]<p>{name}</p>
  </div>
}`;
    const editor = new InMemoryEditor(code);

    await extractVariable(editor);

    expect(editor.code).toBe(`function render() {
  const extracted = <p>{name}</p>;
  return <div className="text-lg font-weight-bold">
    {extracted}
  </div>
}`);
  });

  it("should not wrap extracted JSX element inside JSX Expression Container when not inside another", async () => {
    const code = `function render() {
  return [cursor]<p>{name}</p>;
}`;
    const editor = new InMemoryEditor(code);

    await extractVariable(editor);

    expect(editor.code).toBe(`function render() {
  const extracted = <p>{name}</p>;
  return extracted;
}`);
  });
});
