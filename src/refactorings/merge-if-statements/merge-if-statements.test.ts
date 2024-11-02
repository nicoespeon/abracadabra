import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code, ErrorReason } from "../../editor/editor";
import { testEach } from "../../tests-helpers";
import { createVisitor, mergeIfStatements } from "./merge-if-statements";

describe("Merge If Statements", () => {
  testEach<{ code: Code; expected: Code }>(
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
        code: `if ([cursor]isValid) {
  if (isCorrect) {
    if (shouldDoSomething) {
      doSomething();
    }
  }
}`,
        expected: `if (isValid && isCorrect) {
  if (shouldDoSomething) {
    doSomething();
  }
}`
      },
      {
        description: "nested if statements, cursor on nested",
        code: `if (isValid) {
  if ([cursor]isCorrect) {
    if (shouldDoSomething) {
      doSomething();
    }
  }
}`,
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
    if ([cursor]shouldDoSomething) {
      doSomething();
    }
  }
}`,
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
    if ([cursor]shouldDoSomething) {
      doSomething();
    } else {
      doAnotherThing();
    }
  }
}`,
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
  if ([cursor]isCorrect) {
    doAnotherThing();
  }
}`,
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
  if ([cursor]isCorrect) {
    doAnotherThing();
  } else {
    doNothing();
  }
}`,
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
    if ([cursor]hasNothingToDo) {
      doNothing();
    } else {
      logSomething();
    }
  }
}`,
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
    if ([cursor]shouldDoSomething) {
      doAnotherThing();
    }
  } else {
    doNothing();
  }
}`,
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
[cursor]  if (shouldDoSomething) {
    doAnotherThing();
  }
}`,
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
[cursor]      doAnotherThing();
    }
  }
}`,
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
[cursor]      doAnotherThing();
    }
  }
}`,
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
[cursor]  if (isCorrect) {
    doAnotherThing();
  }
}`,
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
[cursor]    doSomethingElse();
  } else if (isCorrect) {
    doAnotherThing();
  }
}`,
        expected: `if (isValid) {
  doSomething();
} else if (shouldDoSomething) {
  doSomethingElse();
} else if (isCorrect) {
  doAnotherThing();
}`
      },
      {
        description: "deeply nested if, cursor on intermediate if",
        code: `if (isValid) {
  doSomething();
} else {
  [cursor]if (shouldDoSomething) {
    doSomethingElse();
  } else {
    if (isCorrect) {
      doAnotherThing();
    }
  }
}`,
        expected: `if (isValid) {
  doSomething();
} else if (shouldDoSomething) {
  doSomethingElse();
} else {
  if (isCorrect) {
    doAnotherThing();
  }
}`
      },
      {
        description: "deeply nested if, cursor on intermediate else",
        code: `if (isValid) {
  doSomething();
} else {
  if (shouldDoSomething) {
    doSomethingElse();
  } [cursor]else {
    if (isCorrect) {
      doAnotherThing();
    }
  }
}`,
        expected: `if (isValid) {
  doSomething();
} else {
  if (shouldDoSomething) {
    doSomethingElse();
  } else if (isCorrect) {
    doAnotherThing();
  }
}`
      },
      {
        description: "consecutive ones with same return (merge with previous)",
        code: `function disabilityAmount(anEmployee) {
  if (anEmployee.seniority < 2) return 0;
  [cursor]if (anEmployee.monthsDisabled > 12) {
    return 0;
  }

  return 100;
}`,
        expected: `function disabilityAmount(anEmployee) {
  if (anEmployee.seniority < 2 || anEmployee.monthsDisabled > 12) return 0;

  return 100;
}`
      },
      {
        description: "consecutive ones with same return (merge with next)",
        code: `function disabilityAmount(anEmployee) {
  [cursor]if (anEmployee.seniority < 2) return 0;
  if (anEmployee.monthsDisabled > 12) {
    return 0;
  }

  return 100;
}`,
        expected: `function disabilityAmount(anEmployee) {
  if (anEmployee.seniority < 2 || anEmployee.monthsDisabled > 12) {
    return 0;
  }

  return 100;
}`
      },
      {
        description: "consecutive ones with same return, but no braces",
        code: `function disabilityAmount(anEmployee) {
  if (!isValid)[cursor]
    return 0;
  else if (isMorning)
    return 0;

  return 100;
}`,
        expected: `function disabilityAmount(anEmployee) {
  if (!isValid || isMorning)
    return 0;

  return 100;
}`
      },
      {
        description: "consecutive ones without returned value (guard clauses)",
        code: `function disabilityAmount(anEmployee) {
  if (!isValid)[cursor]
    return;
  else if (isMorning)
    return;

  return 100;
}`,
        expected: `function disabilityAmount(anEmployee) {
  if (!isValid || isMorning)
    return;

  return 100;
}`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await mergeIfStatements(editor);

      expect(editor.code).toBe(expected);
    }
  );

  testEach<{ code: Code }>(
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
  if[cursor] (isCorrect) {
    doSomethingElse();
  }

  doAnotherThing();
}`
      },
      {
        description: "consecutive ones with different return, but no braces",
        code: `function disabilityAmount(anEmployee) {
  if (!isValid)[cursor]
    return 0;
  else if (isMorning)
    return 50;

  return 100;
}`
      }
    ],
    async ({ code }) => {
      const editor = new InMemoryEditor(code);
      const originalCode = editor.code;

      await mergeIfStatements(editor);

      expect(editor.code).toBe(originalCode);
    }
  );

  it("should throw an error if there is nothing to merge", async () => {
    const code = `if ([cursor]isValid) {}`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await mergeIfStatements(editor);

    expect(editor.showError).toHaveBeenCalledWith(
      ErrorReason.DidNotFindIfStatementsToMerge
    );
  });

  it("should not match a guard clause", async () => {
    const code = `function toto() {
  if (isValid || isMorning)[cursor] return
}`;
    const editor = new InMemoryEditor(code);

    await expect(createVisitor).not.toMatchEditor(editor);
  });

  it("should not match else-if with different returned values", async () => {
    const code = `function toto() {
  if (isValid)
    return 50;
  else if (isMorning)[cursor]
    return 100;
}`;
    const editor = new InMemoryEditor(code);

    await expect(createVisitor).not.toMatchEditor(editor);
  });
});
