import { Editor, ErrorReason, Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { mergeWithPreviousIfStatement } from "./merge-with-previous-if-statement";

describe("Merge With Previous If Statement", () => {
  let showErrorMessage: Editor["showError"];

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; selection: Selection; expected: Code }>(
    "should merge with previous if statement",
    [
      {
        description: "basic statement",
        code: `if (isValid) {
  doSomething();
}

doSomethingElse();`,
        selection: Selection.cursorAt(4, 0),
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

doSomethingElse();`,
        selection: Selection.cursorAt(10, 0),
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

  doSomethingElse();
}`,
        selection: Selection.cursorAt(9, 2),
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

    doSomethingElse();
  }
}`,
        selection: Selection.cursorAt(8, 2),
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

doSomethingElse();`,
        selection: Selection.cursorAt(2, 0),
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

doSomethingElse();`,
        selection: Selection.cursorAt(6, 0),
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

doSomethingElse();`,
        selection: Selection.cursorAt(8, 0),
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

if (isCorrect) {
  doSomethingElse();
}`,
        selection: Selection.cursorAt(4, 0),
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

if (isValid) {
  doSomethingElse();
}`,
        selection: Selection.cursorAt(4, 0),
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

if (name === "John" && age > 10) {
  doSomethingElse();
}`,
        selection: Selection.cursorAt(4, 0),
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

if (isValid) {
  doSomethingElse();
}`,
        selection: Selection.cursorAt(6, 0),
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

if (isValid) {
  doSomethingElse();
} else {
  sayHello();
}`,
        selection: Selection.cursorAt(6, 0),
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

if (isValid) {
  doSomethingElse();
} else {
  sayHello();
}`,
        selection: Selection.cursorAt(4, 0),
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

if (isValid) {
  doSomethingElse();
} else {
  sayHello();
}`,
        selection: Selection.cursorAt(8, 0),
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

if (isValid) {
  doSomethingElse();
} else if (isCorrect) {
  sayHello();
} else {
  sayGoodbye();
}`,
        selection: Selection.cursorAt(8, 0),
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

if (isValid) {
  doSomethingElse();
} else if (shouldSayHello) {
  sayHello();
} else {
  sayGoodbye();
}`,
        selection: Selection.cursorAt(8, 0),
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

if (isValid) {
  doSomethingElse();
} else if (isCorrect) {
  sayHello();
} else {
  sayGoodbye();
}`,
        selection: Selection.cursorAt(4, 0),
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
    async ({ code, selection, expected }) => {
      const result = await doMergeWithPreviousIfStatement(code, selection);

      expect(result).toBe(expected);
    }
  );

  testEach<{ code: Code; selection: Selection }>(
    "should not merge",
    [
      {
        description: "previous statement is not an if",
        code: `while (isValid) {
  doSomething();
}

doSomethingElse();`,
        selection: Selection.cursorAt(4, 0)
      },
      {
        description: "has no statement before",
        code: `doSomethingElse();

if (isValid) {
  doSomething();
}`,
        selection: Selection.cursorAt(0, 0)
      },
      {
        description: "if statement is 2 nodes above",
        code: `if (isValid) {
  doSomething();
}

doSomethingElse();
doAnotherThing();`,
        selection: Selection.cursorAt(5, 0)
      }
    ],
    async ({ code, selection }) => {
      const result = await doMergeWithPreviousIfStatement(code, selection);

      expect(result).toBe(code);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const selection = Selection.cursorAt(0, 0);

    await doMergeWithPreviousIfStatement(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundStatementToMerge
    );
  });

  async function doMergeWithPreviousIfStatement(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const editor = new InMemoryEditor(code);
    editor.showError = showErrorMessage;
    await mergeWithPreviousIfStatement(code, selection, editor);
    return editor.code;
  }
});
