import { ErrorReason, Code } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { toggleBraces } from "./toggle-braces";

describe("Toggle Braces", () => {
  testEach<{ code: Code; expected: Code }>(
    "should add braces",
    [
      {
        description: "to an if statement",
        code: "if (!isValid) ret[cursor]urn;",
        expected: `if (!isValid) {
  return;
}`
      },
      {
        description: "to an if statement, cursor on if",
        code: "[cursor]if (!isValid) return;",
        expected: `if (!isValid) {
  return;
}`
      },
      {
        description: "if-else scenario, selecting if",
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
        description: "if-else scenario, selecting else",
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
        description: "if-else scenario, cursor on else",
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

      await toggleBraces(editor);

      expect(editor.code).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await toggleBraces(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindStatementToToggleBraces
    );
  });
});
