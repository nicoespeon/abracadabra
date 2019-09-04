import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { mergeIfStatements } from "./merge-if-statements";

describe("Split If Statement", () => {
  let showErrorMessage: Editor["showError"];

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; selection?: Selection; expected: Code }>(
    "should merge if statements",
    [
      {
        description: "basic scenario",
        code: `if (isValid) {
  if (isCorrect) {
    doSomething();
  }
}`,
        expected: `if (isValid && isCorrect) {
  doSomething();
}`
      },
      {
        description: "without block statements",
        code: `if (isValid)
  if (isCorrect)
    doSomething();`,
        expected: `if (isValid && isCorrect) {
  doSomething();
}`
      },
      {
        description: "nested if statements, cursor on wrapper",
        code: `if (isValid) {
  if (isCorrect) {
    if (shouldDoSomething) {
      doSomething();
    }
  }
}`,
        selection: Selection.cursorAt(0, 4),
        expected: `if (isValid && isCorrect) {
  if (shouldDoSomething) {
    doSomething();
  }
}`
      },
      {
        description: "nested if statements, cursor on nested",
        code: `if (isValid) {
  if (isCorrect) {
    if (shouldDoSomething) {
      doSomething();
    }
  }
}`,
        selection: Selection.cursorAt(1, 6),
        expected: `if (isValid) {
  if (isCorrect && shouldDoSomething) {
    doSomething();
  }
}`
      },
      {
        description: "nested if statements, cursor on deepest nested",
        code: `if (isValid) {
  if (isCorrect) {
    if (shouldDoSomething) {
      doSomething();
    }
  }
}`,
        selection: Selection.cursorAt(2, 8),
        expected: `if (isValid) {
  if (isCorrect && shouldDoSomething) {
    doSomething();
  }
}`
      },
      {
        description:
          "nested if statements, cursor on nested, deepest nested has an alternate node",
        code: `if (isValid) {
  if (isCorrect) {
    if (shouldDoSomething) {
      doSomething();
    } else {
      doAnotherThing();
    }
  }
}`,
        selection: Selection.cursorAt(2, 8),
        expected: `if (isValid && isCorrect) {
  if (shouldDoSomething) {
    doSomething();
  } else {
    doAnotherThing();
  }
}`
      },
      {
        description: "nested if statement in else, cursor on nested",
        code: `if (isValid) {
  doSomething();
} else {
  if (isCorrect) {
    doAnotherThing();
  }
}`,
        selection: Selection.cursorAt(3, 6),
        expected: `if (isValid) {
  doSomething();
} else if (isCorrect) {
  doAnotherThing();
}`
      },
      {
        description: "nested if-else statement in else, cursor on nested",
        code: `if (isValid) {
  doSomething();
} else {
  if (isCorrect) {
    doAnotherThing();
  } else {
    doNothing();
  }
}`,
        selection: Selection.cursorAt(3, 6),
        expected: `if (isValid) {
  doSomething();
} else if (isCorrect) {
  doAnotherThing();
} else {
  doNothing();
}`
      },
      {
        description:
          "nested if-else statements in else, cursor on deepest nested",
        code: `if (isValid) {
  doSomething();
} else {
  if (isCorrect) {
    doAnotherThing();
  } else {
    if (hasNothingToDo) {
      doNothing();
    } else {
      logSomething();
    }
  }
}`,
        selection: Selection.cursorAt(6, 6),
        expected: `if (isValid) {
  doSomething();
} else {
  if (isCorrect) {
    doAnotherThing();
  } else if (hasNothingToDo) {
    doNothing();
  } else {
    logSomething();
  }
}`
      },
      {
        description: "nested if statements in else, cursor on deepest nested",
        code: `if (isValid) {
  doSomething();
} else {
  if (isCorrect) {
    if (shouldDoSomething) {
      doAnotherThing();
    }
  } else {
    doNothing();
  }
}`,
        selection: Selection.cursorAt(4, 6),
        expected: `if (isValid) {
  doSomething();
} else if (isCorrect) {
  if (shouldDoSomething) {
    doAnotherThing();
  }
} else {
  doNothing();
}`
      },
      {
        description: "nested if statements in if & else, cursor on wrapper",
        code: `if (isValid) {
  if (isCorrect) {
    doSomething();
  }
} else {
  if (shouldDoSomething) {
    doAnotherThing();
  }
}`,
        selection: Selection.cursorAt(0, 0),
        expected: `if (isValid) {
  if (isCorrect) {
    doSomething();
  }
} else if (shouldDoSomething) {
  doAnotherThing();
}`
      },
      {
        description: "nested if statements in if & else, cursor on alternate",
        code: `if (isValid) {
  if (isCorrect) {
    doSomething();
  }
} else {
  if (shouldDoSomething) {
    doAnotherThing();
  }
}`,
        selection: Selection.cursorAt(5, 0),
        expected: `if (isValid) {
  if (isCorrect) {
    doSomething();
  }
} else if (shouldDoSomething) {
  doAnotherThing();
}`
      },
      {
        description: "nested if statements in else, cursor on deepest nested",
        code: `if (isValid) {
  doSomething();
} else {
  if (shouldDoSomething) {
    if (isCorrect) {
      doAnotherThing();
    }
  }
}`,
        selection: Selection.cursorAt(5, 0),
        expected: `if (isValid) {
  doSomething();
} else {
  if (shouldDoSomething && isCorrect) {
    doAnotherThing();
  }
}`
      },
      {
        description:
          "nested if-else statements in if, cursor on deepest nested",
        code: `if (isValid) {
  if (shouldDoSomething) {
    doSomething();
  } else {
    if (isCorrect) {
      doAnotherThing();
    }
  }
}`,
        selection: Selection.cursorAt(5, 0),
        expected: `if (isValid) {
  if (shouldDoSomething) {
    doSomething();
  } else if (isCorrect) {
    doAnotherThing();
  }
}`
      },
      {
        description: "nested if in else-if statement",
        code: `if (isValid) {
  doSomething();
} else if (shouldDoSomething) {
  if (isCorrect) {
    doAnotherThing();
  }
}`,
        selection: Selection.cursorAt(3, 0),
        expected: `if (isValid) {
  doSomething();
} else if (shouldDoSomething && isCorrect) {
  doAnotherThing();
}`
      },
      {
        description: "nested else-if in else statement",
        code: `if (isValid) {
  doSomething();
} else {
  if (shouldDoSomething) {
    doSomethingElse();
  } else if (isCorrect) {
    doAnotherThing();
  }
}`,
        selection: Selection.cursorAt(4, 0),
        expected: `if (isValid) {
  doSomething();
} else if (shouldDoSomething) {
  doSomethingElse();
} else if (isCorrect) {
  doAnotherThing();
}`
      }
    ],
    async ({ code, selection = Selection.cursorAt(0, 0), expected }) => {
      const result = await doMergeIfStatements(code, selection);

      expect(result).toBe(expected);
    }
  );

  testEach<{ code: Code; selection?: Selection }>(
    "should not merge if statements",
    [
      {
        description: "nested if has an alternate node",
        code: `if (isValid) {
  if (isCorrect) {
    doSomething();
  } else {
    doAnotherThing();
  }
}`
      },
      {
        description: "wrapping if has an alternate node",
        code: `if (isValid) {
  if (isCorrect) {
    doSomething();
  }
} else {
  doAnotherThing();
}`
      },
      {
        description: "nested if has a sibling node",
        code: `if (isValid) {
  if (isCorrect) {
    doSomething();
  }

  doAnotherThing();
}`
      },
      {
        description: "nested if in alternate has a sibling node",
        code: `if (isValid) {
  doSomething();
} else {
  if (isCorrect) {
    doSomethingElse();
  }

  doAnotherThing();
}`,
        selection: Selection.cursorAt(3, 4)
      }
    ],
    async ({ code, selection = Selection.cursorAt(0, 0) }) => {
      const result = await doMergeIfStatements(code, selection);

      expect(result).toBe(code);
    }
  );

  it("should throw an error if there is nothing to merge", async () => {
    const code = `if (isValid) {}`;
    const selection = Selection.cursorAt(0, 4);

    await doMergeIfStatements(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundIfStatementsToMerge
    );
  });

  async function doMergeIfStatements(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const editor = new InMemoryEditor(code);
    editor.showError = showErrorMessage;
    await mergeIfStatements(code, selection, editor);
    return editor.code;
  }
});
