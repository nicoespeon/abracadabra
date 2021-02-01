import { ErrorReason, Code } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { splitMultipleDeclarations } from "./split-multiple-declarations";

describe("Split Multiple Declarations", () => {
  testEach<{ code: Code; expected: Code }>(
    "should split multiple declarations",
    [
      {
        description: "basic let multiple declarations",
        code: `let firstName, lastName;`,
        expected: `let firstName;
let lastName;`
      },
      {
        description: "basic var multiple declarations",
        code: `var firstName, lastName;`,
        expected: `var firstName;
var lastName;`
      },
      {
        description: "basic const multiple declarations",
        code: `const firstName = "Jane", lastName = "Doe";`,
        expected: `const firstName = "Jane";
const lastName = "Doe";`
      },
      {
        description:
          "mixed multiple declarations with initialization and without initialization",
        code: `let firstName = 'John', lastName, details = {age: 10, country: "Moon"};`,
        expected: `let firstName = 'John';
let lastName;
let details = {age: 10, country: "Moon"};`
      },
      {
        description:
          "typescript multiple declarations split conserves type annotations",
        code: `let firstName: string = 'John', age: number = 7`,
        expected: `let firstName: string = 'John';
let age: number = 7;`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await splitMultipleDeclarations(editor);

      expect(editor.code).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await splitMultipleDeclarations(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindMultipleDeclarationsToSplit
    );
  });
});
