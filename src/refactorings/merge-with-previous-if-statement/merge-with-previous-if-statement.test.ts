import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code } from "../../editor/editor";
import { mergeWithPreviousIfStatement } from "./merge-with-previous-if-statement";

describe("Merge With Previous If Statement", () => {
  describe("should merge with previous if statement", () => {
    it("basic statement", () => {
      shouldMergeWithPreviousIfStatement({
        code: `if (isValid) {
  doSomething();
}

[cursor]doSomethingElse();`,
        expected: `if (isValid) {
  doSomething();

  doSomethingElse();
}`
      });
    });

    it("selected statement only", () => {
      shouldMergeWithPreviousIfStatement({
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
      });
    });

    it("nested statement", () => {
      shouldMergeWithPreviousIfStatement({
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
      });
    });

    it("nested statement, nested doesn't match", () => {
      shouldMergeWithPreviousIfStatement({
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
      });
    });

    it("if has no block statement", () => {
      shouldMergeWithPreviousIfStatement({
        code: `if (isValid) doSomething();

[cursor]doSomethingElse();`,
        expected: `if (isValid) {
  doSomething();

  doSomethingElse();
}`
      });
    });

    it("merge with if-else", () => {
      shouldMergeWithPreviousIfStatement({
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
      });
    });

    it("merge with if-elseif-else", () => {
      shouldMergeWithPreviousIfStatement({
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
      });
    });

    it("merge 2 simple if statements, different tests", () => {
      shouldMergeWithPreviousIfStatement({
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
      });
    });

    it("merge 2 simple if statements, same tests", () => {
      shouldMergeWithPreviousIfStatement({
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
      });
    });

    it("merge 2 simple if statements, same complex tests", () => {
      shouldMergeWithPreviousIfStatement({
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
      });
    });

    it("merge simple if statement with if-else, same tests", () => {
      shouldMergeWithPreviousIfStatement({
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
      });
    });

    it("merge if-else with if-else, same tests", () => {
      shouldMergeWithPreviousIfStatement({
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
      });
    });

    it("merge if-else with if, same tests", () => {
      shouldMergeWithPreviousIfStatement({
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
      });
    });

    it("merge if-else with if-elseif-else, same tests", () => {
      shouldMergeWithPreviousIfStatement({
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
      });
    });

    it("merge if-elseif-else with if-elseif-else, same tests", () => {
      shouldMergeWithPreviousIfStatement({
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
      });
    });

    it("merge if-elseif-else with if-elseif-else, different tests", () => {
      shouldMergeWithPreviousIfStatement({
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
      });
    });

    it("merge if-elseif-else with if, same tests", () => {
      shouldMergeWithPreviousIfStatement({
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
      });
    });
  });

  describe("should not merge", () => {
    it("previous statement is not an if", () => {
      shouldNotMerge({
        code: `while (isValid) {
  doSomething();
}

[cursor]doSomethingElse();`
      });
    });

    it("has no statement before", () => {
      shouldNotMerge({
        code: `doSomethingElse();

if (isValid) {
  doSomething();
}`
      });
    });

    it("if statement is 2 nodes above", () => {
      shouldNotMerge({
        code: `if (isValid) {
  doSomething();
}

doSomethingElse();
[cursor]doAnotherThing();`
      });
    });
  });

  it("should show an error message if refactoring can't be made", () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    const result = mergeWithPreviousIfStatement({
      state: "new",
      code: editor.code,
      selection: editor.selection,
      highlightSources: []
    });

    expect(result.action).toBe("show error");
  });
});

function shouldMergeWithPreviousIfStatement({
  code,
  expected
}: {
  code: Code;
  expected: Code;
}) {
  const editor = new InMemoryEditor(code);
  const result = mergeWithPreviousIfStatement({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });

  expect(result).toMatchObject({ action: "write", code: expected });
}

function shouldNotMerge({ code }: { code: Code }) {
  const editor = new InMemoryEditor(code);
  const result = mergeWithPreviousIfStatement({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });

  expect(result.action).toBe("show error");
}
