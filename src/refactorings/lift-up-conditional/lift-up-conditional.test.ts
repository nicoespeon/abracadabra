import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code, ErrorReason } from "../../editor/editor";
import { testEach } from "../../tests-helpers";

import { liftUpConditional } from "./lift-up-conditional";

describe("Lift Up Conditional", () => {
  testEach<{ code: Code; expected: Code }>(
    "should lift up conditional",
    [
      {
        description: "simple if nested in another if",
        code: `if (isValid) {
  [cursor]if (isCorrect) {
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
  [cursor]if (isCorrect) {
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
  if (isValid)
    {} else {
    doAnotherThing();
  }
}`
      },
      {
        description: "if-else nested in a simple if",
        code: `if (isValid) {
  [cursor]if (isCorrect) {
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
  [cursor]if (isCorrect) {
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
  [cursor]if (isCorrect) {
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
    [cursor]if (shouldDoSomething) {
      doSomething();
    }
  }
}`,
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
  [cursor]if (canLog) {
    logData();
  }
}`,
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

  [cursor]if (isValid) {
    doSomethingElse();
  }

  logData();
}`,
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

  [cursor]if (isValid) {
    doSomethingElse();
  } else {
    doNothing();
  }

  logData();
}`,
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

  [cursor]if (isValid) {
    doSomethingElse();
  } else {
    doNothing();
  }

  logData();
} else {
  doAnotherThing();
}`,
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
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await liftUpConditional(editor);

      expect(editor.code).toBe(expected);
    }
  );

  testEach<{ code: Code }>(
    "should not lift up",
    [
      // We don't handle scenarios where nested if is in the else node.
      // This would be an improvement: handle if & if-else nested in else node.
      {
        description: "simple if in else",
        code: `if (isCorrect) {
  doSomething();
} else {
  [cursor]if (isValid) {
    doSomethingElse();
  }
}`
      }
    ],
    async ({ code }) => {
      const editor = new InMemoryEditor(code);
      const originalCode = editor.code;

      await liftUpConditional(editor);

      expect(editor.code).toBe(originalCode);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await liftUpConditional(editor);

    expect(editor.showError).toBeCalledWith(ErrorReason.DidNotFindNestedIf);
  });
});
