import { Code } from "../../../editor/editor";
import { Position } from "../../../editor/position";
import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { testEach } from "../../../tests-helpers";

import { extractVariable } from "./extract-variable";

describe("Extract Variable - JSX we can extract", () => {
  testEach<{
    code: Code;
    expected: Code;
    expectedPosition?: Position;
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
  return <Header title="H[cursor]ome" />;
}`,
        expected: `function render() {
  const home = "Home";
  return <Header title={home} />;
}`
      },
      {
        description: "a JSX element (cursor on opening tag)",
        code: `function render() {
  return <d[cursor]iv className="text-lg font-weight-bold">
    {this.props.location.name}
  </div>;
}`,
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
  <[cursor]/div>;
}`,
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
    <p[cursor]>{this.props.location.name}</p>
  </div>;
}`,
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
  <p>H[cursor]ello there!</p>
</div>;`,
        expected: `const extracted = "Hello there!";
const body = <div className="text-lg font-weight-bold">
  <p>{extracted}</p>
</div>;`
      },
      {
        description: "a value in a JSXExpressionContainer",
        code: `<Component
  text={getTextForPerson({
    name: "P[cursor]edro"
  })}
/>`,
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
  return <Button onClick={this.onC[cursor]lick()} />;
}`,
        expected: `function render() {
  const extracted = this.onClick();
  return <Button onClick={extracted} />;
}`
      }
    ],
    async ({ code, expected, expectedPosition }) => {
      const editor = new InMemoryEditor(code);

      await extractVariable(editor);

      expect(editor.code).toBe(expected);
      if (expectedPosition) {
        expect(editor.position).toStrictEqual(expectedPosition);
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
