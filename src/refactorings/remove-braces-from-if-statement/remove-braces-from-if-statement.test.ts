import { Editor, ErrorReason, Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import * as t from "../../ast";
import { testEach } from "../../tests-helpers";

import {
  removeBracesFromIfStatement,
  hasIfStatementWithBraces
} from "./remove-braces-from-if-statement";

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

  describe(hasIfStatementWithBraces, () => {
    it("should not offer refactoring for block with multiple statements, selection on if", async () => {
      const code = `if (!isValid) { 
    doSomething(); 
    return;
  }`;
      const ast = t.parse(code);
      const selection = Selection.cursorAt(0, 0);

      const hasMatchingIfStatement = hasIfStatementWithBraces(ast, selection);

      expect(hasMatchingIfStatement).toBe(false);
    });

    it("should offer refactoring for block with single statement, selection on if", async () => {
      const code = `if (!isValid) { 
    doSomething();
  }`;
      const ast = t.parse(code);
      const selection = Selection.cursorAt(0, 0);

      const hasMatchingIfStatement = hasIfStatementWithBraces(ast, selection);

      expect(hasMatchingIfStatement).toBe(true);
    });

    it("should not offer refactoring for block with multiple statements, selection on else", async () => {
      const code = `if (!isValid) { 
    doSomething(); 
  } else {
    doSomethingElse();
    return;
  }`;
      const ast = t.parse(code);
      const selection = Selection.cursorAt(2, 4);

      const hasMatchingIfStatement = hasIfStatementWithBraces(ast, selection);

      expect(hasMatchingIfStatement).toBe(false);
    });

    it("should offer refactoring for block with multiple statements, selection on else", async () => {
      const code = `if (!isValid) { 
    doSomething(); 
  } else {
    doSomethingElse();
  }`;
      const ast = t.parse(code);
      const selection = Selection.cursorAt(2, 4);

      const hasMatchingIfStatement = hasIfStatementWithBraces(ast, selection);

      expect(hasMatchingIfStatement).toBe(true);
    });
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
