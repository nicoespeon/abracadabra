import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code } from "../../editor/editor";
import { liftUpConditional } from "./lift-up-conditional";

describe("Lift Up Conditional", () => {
  describe("should lift up conditional", () => {
    it("simple if nested in another if", () => {
      shouldLiftUpConditional({
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
      });
    });

    it("simple if nested in another if with else", () => {
      shouldLiftUpConditional({
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
      });
    });

    it("if-else nested in a simple if", () => {
      shouldLiftUpConditional({
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
      });
    });

    it("if-else nested in another if-else", () => {
      shouldLiftUpConditional({
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
      });
    });

    it("deeply nested if, cursor on intermediate if", () => {
      shouldLiftUpConditional({
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
      });
    });

    it("deeply nested if, cursor on deepest if", () => {
      shouldLiftUpConditional({
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
      });
    });

    it("selected if only", () => {
      shouldLiftUpConditional({
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
      });
    });

    it("simple if nested with sibling statements", () => {
      shouldLiftUpConditional({
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
      });
    });

    it("if-else nested with sibling statements", () => {
      shouldLiftUpConditional({
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
      });
    });

    it("if-else nested in another if-else, with sibling statements", () => {
      shouldLiftUpConditional({
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
      });
    });
  });

  describe("should not lift up", () => {
    // We don't handle scenarios where nested if is in the else node.
    // This would be an improvement: handle if & if-else nested in else node.
    it("simple if in else", () => {
      const code = `if (isCorrect) {
  doSomething();
} else {
  [cursor]if (isValid) {
    doSomethingElse();
  }
}`;
      const editor = new InMemoryEditor(code);
      const result = liftUpConditional({
        state: "new",
        code: editor.code,
        selection: editor.selection,
        highlightSources: []
      });

      expect(result.action).toBe("show error");
    });
  });

  it("should show an error message if refactoring can't be made", () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    const result = liftUpConditional({
      state: "new",
      code: editor.code,
      selection: editor.selection,
      highlightSources: []
    });

    expect(result.action).toBe("show error");
  });
});

function shouldLiftUpConditional({
  code,
  expected
}: {
  code: Code;
  expected: Code;
}) {
  const editor = new InMemoryEditor(code);
  const result = liftUpConditional({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });

  expect(result).toMatchObject({ action: "write", code: expected });
}
