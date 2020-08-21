import { ErrorReason, Code } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { addBracesToIfStatement } from "./add-braces-to-if-statement";

describe("Add Braces To If Statement", () => {
  testEach<{ code: Code; expected: Code }>(
    "should add braces to if statement",
    [
      {
        description: "basic scenario",
        code: "if (!isValid) ret[cursor]urn;",
        expected: `if (!isValid) {
  return;
}`
      },
      {
        description: "basic scenario, cursor on if",
        code: "[cursor]if (!isValid) return;",
        expected: `if (!isValid) {
  return;
}`
      },
      {
        description: "basic if-else scenario, selecting if",
        code: `if (isValid)
  d[cursor]oSomething();
else
  doAnotherThing();`,
        expected: `if (isValid) {
  doSomething();
} else
  doAnotherThing();`
      },
      {
        description: "basic if-else scenario, selecting else",
        code: `if (isValid)
  doSomething();
else
  d[cursor]oAnotherThing();`,
        expected: `if (isValid)
  doSomething();
else {
  doAnotherThing();
}`
      },
      {
        description: "basic if-else scenario, cursor on else",
        code: `if (isValid)
  doSomething();
[cursor]else
  doAnotherThing();`,
        expected: `if (isValid)
  doSomething();
else {
  doAnotherThing();
}`
      },
      {
        description: "many if statements, 2nd one selected",
        code: `if (isProd) logEvent();

if (isValid)
  [cursor]doSomething();
else
  doAnotherThing();`,
        expected: `if (isProd) logEvent();

if (isValid) {
  doSomething();
} else
  doAnotherThing();`
      },
      {
        description: "nested if statements, cursor on nested",
        code: `if (isProd)
  if (isValid)
    [cursor]doSomething();`,
        expected: `if (isProd)
  if (isValid) {
    doSomething();
  }`
      },
      {
        description: "multiple statements after if",
        code: `if (isValid)
  [cursor]doSomething();
  doAnotherThing();`,
        expected: `if (isValid) {
  doSomething();
}
  doAnotherThing();`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await addBracesToIfStatement(editor);

      expect(editor.code).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `[cursor]// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await addBracesToIfStatement(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindIfStatementToAddBraces
    );
  });

  it("should throw an error if statement already has braces", async () => {
    const code = `[cursor]if (!isValid) {
 return;
}`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await addBracesToIfStatement(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindIfStatementToAddBraces
    );
  });
});
