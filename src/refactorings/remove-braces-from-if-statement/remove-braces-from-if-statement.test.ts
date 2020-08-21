import { ErrorReason, Code } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { removeBracesFromIfStatement } from "./remove-braces-from-if-statement";

describe("Remove Braces from If Statement", () => {
  testEach<{ code: Code; expected: Code }>(
    "remove braces from if statement",
    [
      {
        description: "basic scenario",
        code: `if (!isValid) {[cursor]
  return;
}`,
        expected: `if (!isValid)
  return;`
      },
      {
        description: "basic scenario, cursor on if",
        code: `if (!isValid) {
  return;
}`,
        expected: `if (!isValid)
  return;`
      },
      {
        description: "basic if-else scenario, selecting if",
        code: `if (isValid) {
  d[cursor]oSomething();
} else
  doAnotherThing();`,
        expected: `if (isValid)
  doSomething();
else
  doAnotherThing();`
      },
      {
        description: "basic if-else scenario, selecting else",
        code: `if (isValid)
  doSomething();
else {
  d[cursor]oAnotherThing();
}`,
        expected: `if (isValid)
  doSomething();
else
  doAnotherThing();`
      },
      {
        description: "basic if-else scenario, cursor on else",
        code: `if (isValid)
  doSomething();
[cursor]else {
  doAnotherThing();
}`,
        expected: `if (isValid)
  doSomething();
else
  doAnotherThing();`
      },
      {
        description: "many if statements, 2nd one selected",
        code: `if (isProd) logEvent();

if (isValid) {
  [cursor]doSomething();
} else
  doAnotherThing();`,
        expected: `if (isProd) logEvent();

if (isValid)
  doSomething();
else
  doAnotherThing();`
      },
      {
        description: "nested if statements, cursor on nested",
        code: `if (isProd)
i[cursor]f (isValid) {
  doSomething();
}`,
        expected: `if (isProd)
if (isValid)
  doSomething();`
      },
      {
        description: "multiple statements after if",
        code: `if (isValid) {
  [cursor]doSomething();
}
doAnotherThing();`,
        expected: `if (isValid)
  doSomething();
doAnotherThing();`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await removeBracesFromIfStatement(editor);

      expect(editor.code).toBe(expected);
    }
  );

  testEach<{ code: Code }>(
    "should not apply to",
    [
      {
        description: "block with multiple statements, selection on if",
        code: `if (!isValid) {[cursor]
  doSomething();
  return;
}`
      },
      {
        description: "block with multiple statements, selection on else",
        code: `if (!isValid) {
  doSomething();
} el[cursor]se {
  doSomethingElse();
  return;
}`
      }
    ],
    async ({ code }) => {
      const editor = new InMemoryEditor(code);
      const originalCode = editor.code;

      await removeBracesFromIfStatement(editor);

      expect(editor.code).toBe(originalCode);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await removeBracesFromIfStatement(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindBracesToRemoveFromIfStatement
    );
  });

  it("should throw an error if statement has no braces", async () => {
    const code = `if (!isValid) return;`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await removeBracesFromIfStatement(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindBracesToRemoveFromIfStatement
    );
  });
});
