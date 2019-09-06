import { Editor, ErrorReason, Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { bubbleUpIfStatement } from "./bubble-up-if-statement";

describe("Bubble Up If Statement", () => {
  let showErrorMessage: Editor["showError"];

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; selection?: Selection; expected: Code }>(
    "should bubble up if statement",
    [
      {
        description: "simple if nested in another if",
        code: `if (isValid) {
  if (isCorrect) {
    doSomething();
  }
}`,
        expected: `if (isCorrect) {
  if (isValid) {
    doSomething();
  }
}`
      },
      {
        description: "simple if nested in another if with else",
        code: `if (isValid) {
  if (isCorrect) {
    doSomething();
  }
} else {
  doAnotherThing();
}`,
        expected: `if (isCorrect) {
  if (isValid) {
    doSomething();
  } else {
    doAnotherThing();
  }
} else {
  doAnotherThing();
}`
      },
      {
        description: "if-else nested in a simple if",
        code: `if (isValid) {
  if (isCorrect) {
    doSomething();
  } else {
    doAnotherThing();
  }
}`,
        expected: `if (isCorrect) {
  if (isValid) {
    doSomething();
  }
} else {
  if (isValid) {
    doAnotherThing();
  }
}`
      }
    ],
    async ({ code, selection = Selection.cursorAt(1, 2), expected }) => {
      const result = await doBubbleUpIfStatement(code, selection);

      expect(result).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const selection = Selection.cursorAt(0, 0);

    await doBubbleUpIfStatement(code, selection);

    expect(showErrorMessage).toBeCalledWith(ErrorReason.DidNotFoundNestedIf);
  });

  async function doBubbleUpIfStatement(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const editor = new InMemoryEditor(code);
    editor.showError = showErrorMessage;
    await bubbleUpIfStatement(code, selection, editor);
    return editor.code;
  }
});
