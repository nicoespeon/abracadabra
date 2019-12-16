import { Editor, ErrorReason, Code } from "../../../editor/editor";
import { Selection } from "../../../editor/selection";
import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { testEach } from "../../../tests-helpers";

import { convertToPureComponent } from "./convert-to-pure-component";

describe("(React) Convert To Pure Component", () => {
  let showErrorMessage: Editor["showError"];

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; selection?: Selection; expected: Code }>(
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
    async ({ code, selection = Selection.cursorAt(0, 0), expected }) => {
      const result = await doConvertToPureComponent(code, selection);

      expect(result).toBe(expected);
    }
  );

  testEach<{ code: Code; selection?: Selection }>(
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
    async ({ code, selection = Selection.cursorAt(0, 0) }) => {
      const result = await doConvertToPureComponent(code, selection);

      expect(result).toBe(code);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const selection = Selection.cursorAt(0, 0);

    await doConvertToPureComponent(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundReactComponent
    );
  });

  async function doConvertToPureComponent(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const editor = new InMemoryEditor(code);
    editor.showError = showErrorMessage;
    await convertToPureComponent(code, selection, editor);
    return editor.code;
  }
});
