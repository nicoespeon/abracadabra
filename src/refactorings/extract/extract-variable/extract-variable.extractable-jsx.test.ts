import { Code } from "../../../editor/editor";
import { Selection } from "../../../editor/selection";
import { Position } from "../../../editor/position";
import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { testEach } from "../../../tests-helpers";

import { extractVariable } from "./extract-variable";

describe("Extract Variable - JSX we can extract", () => {
  testEach<{
    code: Code;
    selection: Selection;
    expected: Code;
    expectedPosition?: Position;
  }>(
    "should extract",
    [
      {
        description: "a variable in a JSX element",
        code: `function render() {
  return <div className="text-lg font-weight-bold">
    {this.props.location.name}
  </div>;
}`,
        selection: Selection.cursorAt(2, 27),
        expected: `function render() {
  const { name } = this.props.location;
  return <div className="text-lg font-weight-bold">
    {name}
  </div>;
}`
      },
      {
        description: "a JSXAttribute",
        code: `function render() {
  return <Header title="Home" />;
}`,
        selection: Selection.cursorAt(1, 25),
        expected: `function render() {
  const home = "Home";
  return <Header title={home} />;
}`
      },
      {
        description: "a JSX element (cursor on opening tag)",
        code: `function render() {
  return <div className="text-lg font-weight-bold">
    {this.props.location.name}
  </div>;
}`,
        selection: Selection.cursorAt(1, 11),
        expected: `function render() {
  const extracted = <div className="text-lg font-weight-bold">
    {this.props.location.name}
  </div>;
  return extracted;
}`
      },
      {
        description: "a JSX element (cursor on closing tag)",
        code: `function render() {
  return <div className="text-lg font-weight-bold">
    {this.props.location.name}
  </div>;
}`,
        selection: Selection.cursorAt(3, 3),
        expected: `function render() {
  const extracted = <div className="text-lg font-weight-bold">
    {this.props.location.name}
  </div>;
  return extracted;
}`
      },
      {
        description: "a nested JSX element",
        code: `function render() {
  return <div className="text-lg font-weight-bold">
    <p>{this.props.location.name}</p>
  </div>;
}`,
        selection: Selection.cursorAt(2, 6),
        expected: `function render() {
  const extracted = <p>{this.props.location.name}</p>;
  return <div className="text-lg font-weight-bold">
    {extracted}
  </div>;
}`,
        // We're 1 character off because of the initial `{`,
        // but rename will still work so it's fine.
        expectedPosition: new Position(3, 13)
      },
      {
        description: "a JSXText",
        code: `const body = <div className="text-lg font-weight-bold">
  <p>Hello there!</p>
</div>;`,
        selection: Selection.cursorAt(1, 6),
        expected: `const extracted = "Hello there!";
const body = <div className="text-lg font-weight-bold">
  <p>{extracted}</p>
</div>;`
      },
      {
        description: "a value in a JSXExpressionContainer",
        code: `<Component
  text={getTextForPerson({
    name: "Pedro"
  })}
/>`,
        selection: Selection.cursorAt(2, 12),
        expected: `const name = "Pedro";
<Component
  text={getTextForPerson({
    name
  })}
/>`
      },
      {
        description: "a call expression in a JSX Element",
        code: `function render() {
  return <Button onClick={this.onClick()} />;
}`,
        selection: Selection.cursorAt(1, 34),
        expected: `function render() {
  const extracted = this.onClick();
  return <Button onClick={extracted} />;
}`
      }
    ],
    async ({ code, selection, expected, expectedPosition }) => {
      const result = await doExtractVariable(code, selection);
      expect(result.code).toBe(expected);

      if (expectedPosition) {
        expect(result.position).toStrictEqual(expectedPosition);
      }
    }
  );

  it("should wrap extracted JSX element inside JSX Expression Container when inside another", async () => {
    const code = `function render() {
  return <div className="text-lg font-weight-bold">
    <p>{name}</p>
  </div>
}`;
    const selection = Selection.cursorAt(2, 4);

    const result = await doExtractVariable(code, selection);

    expect(result.code).toBe(`function render() {
  const extracted = <p>{name}</p>;
  return <div className="text-lg font-weight-bold">
    {extracted}
  </div>
}`);
  });

  it("should not wrap extracted JSX element inside JSX Expression Container when not inside another", async () => {
    const code = `function render() {
  return <p>{name}</p>;
}`;
    const selection = Selection.cursorAt(1, 9);

    const result = await doExtractVariable(code, selection);

    expect(result.code).toBe(`function render() {
  const extracted = <p>{name}</p>;
  return extracted;
}`);
  });

  async function doExtractVariable(
    code: Code,
    selection: Selection
  ): Promise<{ code: Code; position: Position }> {
    const editor = new InMemoryEditor(code);
    await extractVariable(code, selection, editor);
    return { code: editor.code, position: editor.position };
  }
});
