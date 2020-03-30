import { Editor, ErrorReason, Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { removeBracesFromIfStatement } from "./remove-braces-from-if-statement";

describe("Remove Braces from If Statement", () => {
  let showErrorMessage: Editor["showError"];

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; selection?: Selection; expected: Code }>(
    "remove braces from if statement",
    [
      {
        description: "basic scenario",
        code: `if (!isValid) {
  return;
}`,
        selection: Selection.cursorAt(0, 15),
        expected: `if (!isValid)
  return;`
      },
      {
        description: "basic scenario, cursor on if",
        code: `if (!isValid) {
  return;
}`,
        selection: Selection.cursorAt(0, 0),
        expected: `if (!isValid)
  return;`
      },
      {
        description: "basic if-else scenario, selecting if",
        code: `if (isValid) {
  doSomething();
} else
  doAnotherThing();`,
        selection: Selection.cursorAt(1, 3),
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
  doAnotherThing();
}`,
        selection: Selection.cursorAt(3, 3),
        expected: `if (isValid)
  doSomething();
else
  doAnotherThing();`
      },
      {
        description: "basic if-else scenario, cursor on else",
        code: `if (isValid)
  doSomething();
else {
  doAnotherThing();
}`,
        selection: Selection.cursorAt(2, 0),
        expected: `if (isValid)
  doSomething();
else
  doAnotherThing();`
      },
      {
        description: "many if statements, 2nd one selected",
        code: `if (isProd) logEvent();

if (isValid) {
  doSomething();
} else
  doAnotherThing();`,
        selection: Selection.cursorAt(3, 2),
        expected: `if (isProd) logEvent();

if (isValid)
  doSomething();
else
  doAnotherThing();`
      },
      {
        description: "nested if statements, cursor on nested",
        code: `if (isProd)
if (isValid) {
  doSomething();
}`,
        selection: Selection.cursorAt(1, 1),
        expected: `if (isProd)
if (isValid)
  doSomething();`
      },
      {
        description: "multiple statements after if",
        code: `if (isValid) {
  doSomething();
}
doAnotherThing();`,
        selection: Selection.cursorAt(1, 2),
        expected: `if (isValid)
  doSomething();
doAnotherThing();`
      }
    ],
    async ({ code, selection = Selection.cursorAt(0, 0), expected }) => {
      const result = await doRemoveBracesFromIfStatement(code, selection);

      expect(result).toBe(expected);
    }
  );

  testEach<{ code: Code; selection?: Selection }>(
    "should not apply to",
    [
      {
        description: "block with multiple statements, selection on if",
        code: `if (!isValid) {
  doSomething();
  return;
}`,
        selection: Selection.cursorAt(0, 15)
      },
      {
        description: "block with multiple statements, selection on else",
        code: `if (!isValid) {
  doSomething();
} else {
  doSomethingElse();
  return;
}`,
        selection: Selection.cursorAt(2, 4)
      }
    ],
    async ({ code, selection = Selection.cursorAt(0, 0) }) => {
      const result = await doRemoveBracesFromIfStatement(code, selection);

      expect(result).toBe(code);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const selection = Selection.cursorAt(0, 0);

    await doRemoveBracesFromIfStatement(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFindBracesToRemoveFromIfStatement
    );
  });

  it("should throw an error if statement has no braces", async () => {
    const code = `if (!isValid) return;`;
    const selection = Selection.cursorAt(0, 0);

    await doRemoveBracesFromIfStatement(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFindBracesToRemoveFromIfStatement
    );
  });

  async function doRemoveBracesFromIfStatement(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const editor = new InMemoryEditor(code);
    editor.showError = showErrorMessage;
    await removeBracesFromIfStatement(code, selection, editor);
    return editor.code;
  }
});
