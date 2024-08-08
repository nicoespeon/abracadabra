import { ErrorReason, Code } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { simplifyBoolean } from "./simplify-boolean";

describe("Simplify Boolean", () => {
  testEach<{ code: Code; expected: Code }>(
    "should simplify boolean",
    [
      {
        description: "true || somethingElse",
        code: `if(true || somethingElse[cursor]) {}`,
        expected: `if(true) {}`
      },
      {
        description: "somethingElse || true",
        code: `if(somethingElse || true[cursor]) {}`,
        expected: `if(true) {}`
      },
      {
        description: "false || somethingElse",
        code: `if(false || somethingElse[cursor]) {}`,
        expected: `if(somethingElse) {}`
      },
      {
        description: "somethingElse || false",
        code: `if(somethingElse || false[cursor]) {}`,
        expected: `if(somethingElse) {}`
      },
      {
        description: "true && somethingElse",
        code: `if(true && somethingElse[cursor]) {}`,
        expected: `if(somethingElse) {}`
      },
      {
        description: "somethingElse && true",
        code: `if(somethingElse && true[cursor]) {}`,
        expected: `if(somethingElse) {}`
      },
      {
        description: "false && somethingElse",
        code: `if(false && somethingElse[cursor]) {}`,
        expected: `if(false) {}`
      },
      {
        description: "somethingElse && false",
        code: `if(somethingElse && false[cursor]) {}`,
        expected: `if(false) {}`
      },
      {
        description: "handle !true as false",
        code: `if(somethingElse && !true[cursor]) {}`,
        expected: `if(!true) {}`
      },
      {
        description: "handle !false as true",
        code: `if(somethingElse || !false[cursor]) {}`,
        expected: `if(!false) {}`
      },
      {
        description: "nested condition",
        code: `if([cursor]somethingElse && true && anotherOne) {}`,
        expected: `if(somethingElse && anotherOne) {}`
      },
      {
        description: "ternary",
        code: `true || somethingElse[cursor] ? "hello" : "world"`,
        expected: `true ? "hello" : "world"`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await simplifyBoolean(editor);

      expect(editor.code).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await simplifyBoolean(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindBooleanToSimplify
    );
  });
});
