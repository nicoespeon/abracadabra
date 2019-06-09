import { UpdateWith, Update, Code } from "./i-update-code";
import { inlineVariable } from "./inline-variable";
import { ShowErrorMessage, ErrorReason } from "./i-show-error-message";
import { Selection } from "./selection";

describe("Inline Variable", () => {
  let showErrorMessage: ShowErrorMessage;
  let updateWith: UpdateWith;
  let updates: Update[] = [];
  const inlinableCode = "Hello!";

  beforeEach(() => {
    showErrorMessage = jest.fn();
    updateWith = jest
      .fn()
      .mockImplementation(
        (_, getUpdates) => (updates = getUpdates(inlinableCode))
      );
  });

  it.each<[string, Selection]>([
    ["all variable declaration is selected", new Selection([0, 0], [0, 18])],
    ["cursor is on value", Selection.cursorAt(0, 14)],
    ["cursor is on identifier", Selection.cursorAt(0, 7)],
    ["cursor is on declarator", Selection.cursorAt(0, 2)]
  ])("should select variable value if %s", async (_, selection) => {
    const code = `const foo = "bar";
console.log(foo);`;

    await doInlineVariable(code, selection);

    expect(updateWith).toBeCalledWith(
      new Selection([0, 12], [0, 17]),
      expect.any(Function)
    );
  });

  it("should inline the variable value that matches selection", async () => {
    const code = `const foo = "bar";
const hello = "World!";
console.log(foo);`;
    const selection = new Selection([0, 0], [0, 18]);

    await doInlineVariable(code, selection);

    expect(updateWith).toBeCalledWith(
      new Selection([0, 12], [0, 17]),
      expect.any(Function)
    );
  });

  it("should update code to inline selection where it's referenced (1 reference)", async () => {
    const code = `const hello = ${inlinableCode};
console.log(hello);`;
    const selection = Selection.cursorAt(0, 14);

    await doInlineVariable(code, selection);

    expect(updates).toEqual([
      {
        code: inlinableCode,
        selection: new Selection([1, 12], [1, 17])
      },
      {
        code: "",
        selection: new Selection([0, 0], [1, 0])
      }
    ]);
  });

  it("should update code to inline selection where it's referenced (many references)", async () => {
    const code = `const hello = ${inlinableCode};
console.log(hello);
sendMessageSaying(hello).to(world);`;
    const selection = Selection.cursorAt(0, 14);

    await doInlineVariable(code, selection);

    expect(updates).toEqual([
      {
        code: inlinableCode,
        selection: new Selection([1, 12], [1, 17])
      },
      {
        code: inlinableCode,
        selection: new Selection([2, 18], [2, 23])
      },
      {
        code: "",
        selection: new Selection([0, 0], [1, 0])
      }
    ]);
  });

  it("should show an error message if selection is not inlinable", async () => {
    const code = `console.log("Nothing to inline here!")`;
    const selection = Selection.cursorAt(0, 0);

    await doInlineVariable(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundInlinableCode
    );
  });

  it("should show an error message if variable is not used", async () => {
    const code = `const hello = "Hello!";`;
    const selection = Selection.cursorAt(0, 0);

    await doInlineVariable(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundInlinableCodeIdentifiers
    );
  });

  async function doInlineVariable(code: Code, selection: Selection) {
    await inlineVariable(code, selection, updateWith, showErrorMessage);
  }
});
