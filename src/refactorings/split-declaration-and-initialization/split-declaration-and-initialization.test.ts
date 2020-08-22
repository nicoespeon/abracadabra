import { Code, ErrorReason } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { splitDeclarationAndInitialization } from "./split-declaration-and-initialization";

describe("Split Declaration and Initialization", () => {
  testEach<{ code: Code; expected: Code }>(
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
  [cursor]"Jane";`,
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
        expected: `let getLastName;

getLastName = () => {
  const lastName = "Doe";
  return lastName;
};`
      },
      {
        description: "nested declaration, cursor on nested",
        code: `const getLastName = () => {
  [cursor]const lastName = "Doe";
  return lastName;
};`,
        expected: `const getLastName = () => {
  let lastName;
  lastName = "Doe";
  return lastName;
};`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await splitDeclarationAndInitialization(editor);

      expect(editor.code).toBe(expected);
    }
  );

  it("should throw an error if there is nothing to split", async () => {
    const code = `pass[cursor]engersCount = 1;`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await splitDeclarationAndInitialization(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindDeclarationToSplit
    );
  });

  it("should throw an error if variable is not initialized", async () => {
    const code = `var [cursor]firstName;`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await splitDeclarationAndInitialization(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindDeclarationToSplit
    );
  });
});
