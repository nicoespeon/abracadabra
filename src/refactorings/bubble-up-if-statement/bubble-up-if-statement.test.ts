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
      },
      {
        description: "if-else nested in another if-else",
        code: `if (isValid) {
  if (isCorrect) {
    doSomething();
  } else {
    doAnotherThing();
  }
} else {
  doNothing();
}`,
        expected: `if (isCorrect) {
  if (isValid) {
    doSomething();
  } else {
    doNothing();
  }
} else {
  if (isValid) {
    doAnotherThing();
  } else {
    doNothing();
  }
}`
      },
      {
        description: "deeply nested if, cursor on intermediate if",
        code: `if (isValid) {
  if (isCorrect) {
    if (shouldDoSomething) {
      doSomething();
    }
  }
}`,
        expected: `if (isCorrect) {
  if (isValid) {
    if (shouldDoSomething) {
      doSomething();
    }
  }
}`
      },
      {
        description: "deeply nested if, cursor on deepest if",
        code: `if (isValid) {
  if (isCorrect) {
    if (shouldDoSomething) {
      doSomething();
    }
  }
}`,
        selection: Selection.cursorAt(2, 4),
        expected: `if (isValid) {
  if (shouldDoSomething) {
    if (isCorrect) {
      doSomething();
    }
  }
}`
      },
      {
        description: "selected if only",
        code: `if (isValid) {
  if (isCorrect) {
    doSomething();
  }
}

if (shouldLog) {
  if (canLog) {
    logData();
  }
}`,
        selection: Selection.cursorAt(7, 2),
        expected: `if (isValid) {
  if (isCorrect) {
    doSomething();
  }
}

if (canLog) {
  if (shouldLog) {
    logData();
  }
}`
      },
      {
        description: "simple if nested with sibling statements",
        code: `if (isCorrect) {
  doSomething();

  if (isValid) {
    doSomethingElse();
  }

  logData();
}`,
        selection: Selection.cursorAt(3, 2),
        expected: `if (isValid) {
  if (isCorrect) {
    doSomething();

    doSomethingElse();

    logData();
  }
} else {
  if (isCorrect) {
    doSomething();

    logData();
  }
}`
      },
      {
        description: "if-else nested with sibling statements",
        code: `if (isCorrect) {
  doSomething();

  if (isValid) {
    doSomethingElse();
  } else {
    doNothing();
  }

  logData();
}`,
        selection: Selection.cursorAt(3, 2),
        expected: `if (isValid) {
  if (isCorrect) {
    doSomething();

    doSomethingElse();

    logData();
  }
} else {
  if (isCorrect) {
    doSomething();

    doNothing();

    logData();
  }
}`
      },
      {
        description:
          "if-else nested in another if-else, with sibling statements",
        code: `if (isCorrect) {
  doSomething();

  if (isValid) {
    doSomethingElse();
  } else {
    doNothing();
  }

  logData();
} else {
  doAnotherThing();
}`,
        selection: Selection.cursorAt(3, 2),
        expected: `if (isValid) {
  if (isCorrect) {
    doSomething();

    doSomethingElse();

    logData();
  } else {
    doAnotherThing();
  }
} else {
  if (isCorrect) {
    doSomething();

    doNothing();

    logData();
  } else {
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
