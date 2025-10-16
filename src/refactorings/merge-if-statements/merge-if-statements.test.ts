import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code } from "../../editor/editor";
import { createVisitor, mergeIfStatements } from "./merge-if-statements";

describe("Merge If Statements", () => {
  describe("should merge if statements", () => {
    it("basic scenario", () => {
      shouldMergeIfStatements({
        code: `if (isValid) {
  if (isCorrect) {
    doSomething();
  }
}`,
        expected: `if (isValid && isCorrect) {
  doSomething();
}`
      });
    });

    it("without block statements", () => {
      shouldMergeIfStatements({
        code: `if (isValid)
  if (isCorrect)
    doSomething();`,
        expected: `if (isValid && isCorrect) {
  doSomething();
}`
      });
    });

    it("nested if statements, cursor on wrapper", () => {
      shouldMergeIfStatements({
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
      });
    });

    it("nested if statements, cursor on nested", () => {
      shouldMergeIfStatements({
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
      });
    });

    it("nested if statements, cursor on deepest nested", () => {
      shouldMergeIfStatements({
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
      });
    });

    it("nested if statements, cursor on nested, deepest nested has an alternate node", () => {
      shouldMergeIfStatements({
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
      });
    });

    it("nested if statement in else, cursor on nested", () => {
      shouldMergeIfStatements({
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
      });
    });

    it("nested if-else statement in else, cursor on nested", () => {
      shouldMergeIfStatements({
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
      });
    });

    it("nested if-else statements in else, cursor on deepest nested", () => {
      shouldMergeIfStatements({
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
      });
    });

    it("nested if statements in else, cursor on deepest nested", () => {
      shouldMergeIfStatements({
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
      });
    });

    it("nested if statements in if & else, cursor on wrapper", () => {
      shouldMergeIfStatements({
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
      });
    });

    it("nested if statements in if & else, cursor on alternate", () => {
      shouldMergeIfStatements({
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
      });
    });

    it("nested if statements in else, cursor on deepest nested", () => {
      shouldMergeIfStatements({
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
      });
    });

    it("nested if-else statements in if, cursor on deepest nested", () => {
      shouldMergeIfStatements({
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
      });
    });

    it("nested if in else-if statement", () => {
      shouldMergeIfStatements({
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
      });
    });

    it("nested else-if in else statement", () => {
      shouldMergeIfStatements({
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
      });
    });

    it("deeply nested if, cursor on intermediate if", () => {
      shouldMergeIfStatements({
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
      });
    });

    it("deeply nested if, cursor on intermediate else", () => {
      shouldMergeIfStatements({
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
      });
    });

    it("consecutive ones with same return (merge with previous)", () => {
      shouldMergeIfStatements({
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
      });
    });

    it("consecutive ones with same return (merge with next)", () => {
      shouldMergeIfStatements({
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
      });
    });

    it("consecutive ones with same return, but no braces", () => {
      shouldMergeIfStatements({
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
      });
    });

    it("consecutive ones without returned value (guard clauses)", () => {
      shouldMergeIfStatements({
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
      });
    });
  });

  describe("should not merge if statements", () => {
    it("nested if has an alternate node", () => {
      shouldNotMergeIfStatements({
        code: `if (isValid) {
  if (isCorrect) {
    doSomething();
  } else {
    doAnotherThing();
  }
}`
      });
    });

    it("wrapping if has an alternate node", () => {
      shouldNotMergeIfStatements({
        code: `if (isValid) {
  if (isCorrect) {
    doSomething();
  }
} else {
  doAnotherThing();
}`
      });
    });

    it("nested if has a sibling node", () => {
      shouldNotMergeIfStatements({
        code: `if (isValid) {
  if (isCorrect) {
    doSomething();
  }

  doAnotherThing();
}`
      });
    });

    it("nested if in alternate has a sibling node", () => {
      shouldNotMergeIfStatements({
        code: `if (isValid) {
  doSomething();
} else {
  if[cursor] (isCorrect) {
    doSomethingElse();
  }

  doAnotherThing();
}`
      });
    });

    it("consecutive ones with different return, but no braces", () => {
      shouldNotMergeIfStatements({
        code: `function disabilityAmount(anEmployee) {
  if (!isValid)[cursor]
    return 0;
  else if (isMorning)
    return 50;

  return 100;
}`
      });
    });
  });

  it("should throw an error if there is nothing to merge", () => {
    const code = `if ([cursor]isValid) {}`;
    const editor = new InMemoryEditor(code);
    const result = mergeIfStatements({
      state: "new",
      code: editor.code,
      selection: editor.selection
    });

    expect(result.action).toBe("show error");
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

function shouldMergeIfStatements({
  code,
  expected
}: {
  code: Code;
  expected: Code;
}) {
  const editor = new InMemoryEditor(code);
  const result = mergeIfStatements({
    state: "new",
    code: editor.code,
    selection: editor.selection
  });

  expect(result).toMatchObject({ action: "write", code: expected });
}

function shouldNotMergeIfStatements({ code }: { code: Code }) {
  const editor = new InMemoryEditor(code);
  const result = mergeIfStatements({
    state: "new",
    code: editor.code,
    selection: editor.selection
  });

  expect(result.action).toBe("show error");
}
