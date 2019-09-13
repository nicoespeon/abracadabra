import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { splitDeclarationAndInitialization } from "./split-declaration-and-initialization";

describe("Split Declaration and Initialization", () => {
  let showErrorMessage: Editor["showError"];

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; selection?: Selection; expected: Code }>(
    "should split declaration and initialization",
    [
      {
        description: "basic const assignment",
        code: `const firstName = "Jane";`,
        expected: `let firstName;
firstName = "Jane";`
      },
      {
        description: "basic var assignment",
        code: `var firstName = "Jane";`,
        expected: `var firstName;
firstName = "Jane";`
      },
      {
        description: "basic let assignment",
        code: `let firstName = "Jane";`,
        expected: `let firstName;
firstName = "Jane";`
      },
      {
        description: "assignment to null",
        code: `const firstName = null;`,
        expected: `let firstName;
firstName = null;`
      },
      {
        description: "the selected assignment",
        code: `const firstName = "Jane";
const lastName = "Doe";`,
        expected: `let firstName;
firstName = "Jane";
const lastName = "Doe";`
      },
      {
        description: "multi-lines assignment (selection in the middle)",
        code: `const firstName =
  "Jane";`,
        selection: Selection.cursorAt(1, 2),
        expected: `let firstName;
firstName = "Jane";`
      },
      {
        description: "multiple declarations",
        code: `const firstName = "Jane", lastName = "Doe";`,
        expected: `let firstName, lastName;
firstName = "Jane";
lastName = "Doe";`
      },
      {
        description: "some declarations without initialization",
        code: `const firstName = "Jane", lastName = "Doe", age;`,
        expected: `let firstName, lastName, age;
firstName = "Jane";
lastName = "Doe";`
      },
      {
        description: "nested declaration, cursor on wrapper",
        code: `const getLastName = () => {
  const lastName = "Doe";
  return lastName;
};`,
        selection: Selection.cursorAt(0, 0),
        expected: `let getLastName;

getLastName = () => {
  const lastName = "Doe";
  return lastName;
};`
      },
      {
        description: "nested declaration, cursor on nested",
        code: `const getLastName = () => {
  const lastName = "Doe";
  return lastName;
};`,
        selection: Selection.cursorAt(1, 2),
        expected: `const getLastName = () => {
  let lastName;
  lastName = "Doe";
  return lastName;
};`
      }
    ],
    async ({ code, selection = Selection.cursorAt(0, 0), expected }) => {
      const result = await doSplitDeclarationAndInitialization(code, selection);

      expect(result).toBe(expected);
    }
  );

  it("should throw an error if there is nothing to split", async () => {
    const code = `passengersCount = 1;`;
    const selection = Selection.cursorAt(0, 4);

    await doSplitDeclarationAndInitialization(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundDeclarationToSplit
    );
  });

  it("should throw an error if variable is not initialized", async () => {
    const code = `var firstName;`;
    const selection = Selection.cursorAt(0, 4);

    await doSplitDeclarationAndInitialization(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundDeclarationToSplit
    );
  });

  async function doSplitDeclarationAndInitialization(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const editor = new InMemoryEditor(code);
    editor.showError = showErrorMessage;
    await splitDeclarationAndInitialization(code, selection, editor);
    return editor.code;
  }
});
