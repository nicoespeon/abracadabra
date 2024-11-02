import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code, ErrorReason } from "../../editor/editor";
import { testEach } from "../../tests-helpers";
import { mergeWithPreviousIfStatement } from "./merge-with-previous-if-statement";

describe("Merge With Previous If Statement", () => {
  testEach<{ code: Code; expected: Code }>(
    "should merge with previous if statement",
    [
      {
        description: "basic statement",
        code: `if (isValid) {
  doSomething();
}

[cursor]doSomethingElse();`,
        expected: `if (isValid) {
  doSomething();

  doSomethingElse();
}`
      },
      {
        description: "selected statement only",
        code: `if (isCorrect) {
  doAnotherThing();
}

sayHello();

if (isValid) {
  doSomething();
}

[cursor]doSomethingElse();`,
        expected: `if (isCorrect) {
  doAnotherThing();
}

sayHello();

if (isValid) {
  doSomething();

  doSomethingElse();
}`
      },
      {
        description: "nested statement",
        code: `if (isCorrect) {
  doAnotherThing();
}

{
  if (isValid) {
    doSomething();
  }

  [cursor]doSomethingElse();
}`,
        expected: `if (isCorrect) {
  doAnotherThing();
}

{
  if (isValid) {
    doSomething();

    doSomethingElse();
  }
}`
      },
      {
        description: "nested statement, nested doesn't match",
        code: `if (isCorrect) {
  doAnotherThing();
}

{
  if (isValid) {
    doSomething();

  [cursor]  doSomethingElse();
  }
}`,
        expected: `if (isCorrect) {
  doAnotherThing();

  {
    if (isValid) {
      doSomething();

      doSomethingElse();
    }
  }
}`
      },
      {
        description: "if has no block statement",
        code: `if (isValid) doSomething();

[cursor]doSomethingElse();`,
        expected: `if (isValid) {
  doSomething();

  doSomethingElse();
}`
      },
      {
        description: "merge with if-else",
        code: `if (isValid) {
  doSomething();
} else {
  doAnotherThing();
}

[cursor]doSomethingElse();`,
        expected: `if (isValid) {
  doSomething();

  doSomethingElse();
} else {
  doAnotherThing();

  doSomethingElse();
}`
      },
      {
        description: "merge with if-elseif-else",
        code: `if (isValid) {
  doSomething();
} else if (isCorrect) {
  sayHello();
} else {
  doAnotherThing();
}

[cursor]doSomethingElse();`,
        expected: `if (isValid) {
  doSomething();

  doSomethingElse();
} else if (isCorrect) {
  sayHello();

  doSomethingElse();
} else {
  doAnotherThing();

  doSomethingElse();
}`
      },
      {
        description: "merge 2 simple if statements, different tests",
        code: `if (isValid) {
  doSomething();
}

[cursor]if (isCorrect) {
  doSomethingElse();
}`,
        expected: `if (isValid) {
  doSomething();

  if (isCorrect) {
    doSomethingElse();
  }
}`
      },
      {
        description: "merge 2 simple if statements, same tests",
        code: `if (isValid) {
  doSomething();
}

[cursor]if (isValid) {
  doSomethingElse();
}`,
        expected: `if (isValid) {
  doSomething();
  doSomethingElse();
}`
      },
      {
        description: "merge 2 simple if statements, same complex tests",
        code: `if (name === "John" && age > 10) {
  doSomething();
}

[cursor]if (name === "John" && age > 10) {
  doSomethingElse();
}`,
        expected: `if (name === "John" && age > 10) {
  doSomething();
  doSomethingElse();
}`
      },
      {
        description: "merge simple if statement with if-else, same tests",
        code: `if (isValid) {
  doSomething();
} else {
  doAnotherThing();
}

[cursor]if (isValid) {
  doSomethingElse();
}`,
        expected: `if (isValid) {
  doSomething();
  doSomethingElse();
} else {
  doAnotherThing();
}`
      },
      {
        description: "merge if-else with if-else, same tests",
        code: `if (isValid) {
  doSomething();
} else {
  doAnotherThing();
}

[cursor]if (isValid) {
  doSomethingElse();
} else {
  sayHello();
}`,
        expected: `if (isValid) {
  doSomething();
  doSomethingElse();
} else {
  doAnotherThing();
  sayHello();
}`
      },
      {
        description: "merge if-else with if, same tests",
        code: `if (isValid) {
  doSomething();
}

[cursor]if (isValid) {
  doSomethingElse();
} else {
  sayHello();
}`,
        expected: `if (isValid) {
  doSomething();
  doSomethingElse();
} else {
  sayHello();
}`
      },
      {
        description: "merge if-else with if-elseif-else, same tests",
        code: `if (isValid) {
  doSomething();
} else if (isCorrect) {
  doAnotherThing();
} else {
  doNothing();
}

[cursor]if (isValid) {
  doSomethingElse();
} else {
  sayHello();
}`,
        expected: `if (isValid) {
  doSomething();
  doSomethingElse();
} else if (isCorrect) {
  doAnotherThing();
  sayHello();
} else {
  doNothing();
  sayHello();
}`
      },
      {
        description: "merge if-elseif-else with if-elseif-else, same tests",
        code: `if (isValid) {
  doSomething();
} else if (isCorrect) {
  doAnotherThing();
} else {
  doNothing();
}

[cursor]if (isValid) {
  doSomethingElse();
} else if (isCorrect) {
  sayHello();
} else {
  sayGoodbye();
}`,
        expected: `if (isValid) {
  doSomething();
  doSomethingElse();
} else if (isCorrect) {
  doAnotherThing();
  sayHello();
} else {
  doNothing();
  sayGoodbye();
}`
      },
      {
        description:
          "merge if-elseif-else with if-elseif-else, different tests",
        code: `if (isValid) {
  doSomething();
} else if (isCorrect) {
  doAnotherThing();
} else {
  doNothing();
}

[cursor]if (isValid) {
  doSomethingElse();
} else if (shouldSayHello) {
  sayHello();
} else {
  sayGoodbye();
}`,
        expected: `if (isValid) {
  doSomething();
  doSomethingElse();
} else if (isCorrect) {
  doAnotherThing();
  if (shouldSayHello) {
    sayHello();
  } else {
    sayGoodbye();
  }
} else {
  doNothing();
  if (shouldSayHello) {
    sayHello();
  } else {
    sayGoodbye();
  }
}`
      },
      {
        description: "merge if-elseif-else with if, same tests",
        code: `if (isValid) {
  doSomething();
}

[cursor]if (isValid) {
  doSomethingElse();
} else if (isCorrect) {
  sayHello();
} else {
  sayGoodbye();
}`,
        expected: `if (isValid) {
  doSomething();
  doSomethingElse();
} else if (isCorrect) {
  sayHello();
} else {
  sayGoodbye();
}`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await mergeWithPreviousIfStatement(editor);

      expect(editor.code).toBe(expected);
    }
  );

  testEach<{ code: Code }>(
    "should not merge",
    [
      {
        description: "previous statement is not an if",
        code: `while (isValid) {
  doSomething();
}

[cursor]doSomethingElse();`
      },
      {
        description: "has no statement before",
        code: `doSomethingElse();

if (isValid) {
  doSomething();
}`
      },
      {
        description: "if statement is 2 nodes above",
        code: `if (isValid) {
  doSomething();
}

doSomethingElse();
[cursor]doAnotherThing();`
      }
    ],
    async ({ code }) => {
      const editor = new InMemoryEditor(code);
      const originalCode = editor.code;

      await mergeWithPreviousIfStatement(editor);

      expect(editor.code).toBe(originalCode);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await mergeWithPreviousIfStatement(editor);

    expect(editor.showError).toHaveBeenCalledWith(
      ErrorReason.DidNotFindStatementToMerge
    );
  });
});
