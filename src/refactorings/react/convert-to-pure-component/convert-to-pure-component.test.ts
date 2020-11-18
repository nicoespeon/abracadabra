import { ErrorReason, Code } from "../../../editor/editor";
import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { testEach } from "../../../tests-helpers";

import { convertToPureComponent } from "./convert-to-pure-component";

describe("(React) Convert To Pure Component", () => {
  testEach<{ code: Code; expected: Code }>(
    "should convert to pure component",
    [
      {
        description: "basic class component",
        code: `class Test extends React.Component {
  render() {
    return <h1>{this.props.title}</h1>;
  }
}`,
        expected: `const Test = (
  {
    title
  }
) => {
  return <h1>{title}</h1>;
};`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await convertToPureComponent(editor);

      expect(editor.code).toBe(expected);
    }
  );

  testEach<{ code: Code }>(
    "should not convert to pure component",
    [
      {
        description: "class that doesn't extend React.Component",
        code: `class Test extends Component {
  render() {
    return <h1>{this.props.title}</h1>;
  }
}`
      },
      {
        description: "class with other methods",
        code: `class Test extends React.Component {
  render() {
    return <h1>{this.getTitle()}</h1>;
  }

  getTitle() {
    return this.props.title;
  }
}`
      }
    ],
    async ({ code }) => {
      const editor = new InMemoryEditor(code);
      const originalCode = editor.code;

      await convertToPureComponent(editor);

      expect(editor.code).toBe(originalCode);
    }
  );

  it("should not use arrow function if user selects not to", async () => {
    const code = `class Test extends React.Component {
  render() {
    return <h1>{this.props.title}</h1>;
  }
}`;
    const editor = new InMemoryEditor(code);
    jest
      .spyOn(editor, "askUserChoice")
      .mockImplementationOnce(async ([_, noArrows]) => noArrows)
      .mockImplementationOnce(async ([destructuring]) => destructuring);

    await convertToPureComponent(editor);

    expect(editor.code).toBe(`function Test(
  {
    title
  }
) {
  return <h1>{title}</h1>;
}`);
  });

  it("should not destructure props if user selects not to", async () => {
    const code = `class Test extends React.Component {
  render() {
    return <h1>{this.props.title}</h1>;
  }
}`;
    const editor = new InMemoryEditor(code);
    jest
      .spyOn(editor, "askUserChoice")
      .mockImplementationOnce(async ([useArrows]) => useArrows)
      .mockImplementationOnce(async ([_, noDestructuring]) => noDestructuring);

    await convertToPureComponent(editor);

    expect(editor.code).toBe(`const Test = props => {
  return <h1>{props.title}</h1>;
};`);
  });

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await convertToPureComponent(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindReactComponent
    );
  });
});
