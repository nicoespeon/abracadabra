import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { splitIfStatement } from "./split-if-statement";

describe("Split If Statement", () => {
  describe("should split if statement", () => {
    it("with && logical expression", () => {
      shouldSplitIfStatement({
        code: `if (isValid && isCorrect) {
  doSomething();
}`,
        expected: `if (isValid) {
  if (isCorrect) {
    doSomething();
  }
}`
      });
    });

    it("|| logical expression", () => {
      shouldSplitIfStatement({
        code: `if (isValid || isCorrect) {
  doSomething();
}`,
        expected: `if (isValid) {
  doSomething();
} else if (isCorrect) {
  doSomething();
}`
      });
    });

    it("multiple parts of logical expression", () => {
      shouldSplitIfStatement({
        code: `if (isValid && isCorrect && shouldDoSomething) {
  doSomething();
}`,
        expected: `if (isValid && isCorrect) {
  if (shouldDoSomething) {
    doSomething();
  }
}`
      });
    });

    it("composed logical expressions", () => {
      shouldSplitIfStatement({
        code: `if (isValid && (isCorrect || shouldDoSomething)) {
  doSomething();
}`,
        expected: `if (isValid) {
  if ((isCorrect || shouldDoSomething)) {
    doSomething();
  }
}`
      });
    });

    it("nested ifs, cursor on wrapper", () => {
      shouldSplitIfStatement({
        code: `if ([cursor]isValid && size > 10) {
  if (isCorrect || shouldDoSomething) {
    doSomething();
  }
}`,
        expected: `if (isValid) {
  if (size > 10) {
    if (isCorrect || shouldDoSomething) {
      doSomething();
    }
  }
}`
      });
    });

    it("nested ifs, cursor on nested", () => {
      shouldSplitIfStatement({
        code: `if (isValid && size > 10) {
  if (isCorrect || shouldDoSomething) {
    [cursor]doSomething();
  }
}`,
        expected: `if (isValid && size > 10) {
  if (isCorrect) {
    doSomething();
  } else if (shouldDoSomething) {
    doSomething();
  }
}`
      });
    });

    it("if/elseif/else pattern, && logical expression", () => {
      shouldSplitIfStatement({
        code: `if (isValid && isCorrect) {
  doSomething();
} else if (isSelected) {
  doAnotherThing();
} else {
  doNothing();
}`,
        expected: `if (isValid) {
  if (isCorrect) {
    doSomething();
  } else if (isSelected) {
    doAnotherThing();
  } else {
    doNothing();
  }
} else if (isSelected) {
  doAnotherThing();
} else {
  doNothing();
}`
      });
    });

    it("if/elseif/else pattern, || logical expression", () => {
      shouldSplitIfStatement({
        code: `if (isValid || isCorrect) {
  doSomething();
} else if (isSelected) {
  doAnotherThing();
} else {
  doNothing();
}`,
        expected: `if (isValid) {
  doSomething();
} else if (isCorrect) {
  doSomething();
} else if (isSelected) {
  doAnotherThing();
} else {
  doNothing();
}`
      });
    });

    it("logical expression in elseif, cursor outside of elseif", () => {
      shouldSplitIfStatement({
        code: `if (isValid || isCorrect) {
[cursor]  doSomething();
} else if (isSelected && shouldDoAnotherThing) {
  doAnotherThing();
} else {
  doNothing();
}`,
        expected: `if (isValid) {
  doSomething();
} else if (isCorrect) {
  doSomething();
} else if (isSelected && shouldDoAnotherThing) {
  doAnotherThing();
} else {
  doNothing();
}`
      });
    });

    it("logical expression in elseif, cursor in elseif", () => {
      shouldSplitIfStatement({
        code: `if (isValid || isCorrect) {
  doSomething();
} else if (isSelected && shouldDoAnotherThing) {
[cursor]  doAnotherThing();
} else {
  doNothing();
}`,
        expected: `if (isValid || isCorrect) {
  doSomething();
} else if (isSelected) {
  if (shouldDoAnotherThing) {
    doAnotherThing();
  } else {
    doNothing();
  }
} else {
  doNothing();
}`
      });
    });

    it("logical expression in elseif, n-th elseif", () => {
      shouldSplitIfStatement({
        code: `if (isValid || isCorrect) {
  doSomething();
} else if (isSelected && shouldDoAnotherThing) {
  doAnotherThing();
} else if (size === 0 && !canDoSomething) {
[cursor]  doNothing();
}`,
        expected: `if (isValid || isCorrect) {
  doSomething();
} else if (isSelected && shouldDoAnotherThing) {
  doAnotherThing();
} else if (size === 0) {
  if (!canDoSomething) {
    doNothing();
  }
}`
      });
    });
  });

  it("should throw an error if logical expression can't be split", () => {
    const code = `if ([cursor]isValid) {}`;
    const editor = new InMemoryEditor(code);
    const result = splitIfStatement({
      state: "new",
      code: editor.code,
      selection: editor.selection,
      highlightSources: []
    });

    expect(result.action).toBe("show error");
  });

  it("should throw an error if logical expression is not in if statement", () => {
    const code = `const isValid = size > 10 &[cursor]& isRequired;`;
    const editor = new InMemoryEditor(code);
    const result = splitIfStatement({
      state: "new",
      code: editor.code,
      selection: editor.selection,
      highlightSources: []
    });

    expect(result.action).toBe("show error");
  });
});

function shouldSplitIfStatement({
  code,
  expected
}: {
  code: string;
  expected: string;
}) {
  const editor = new InMemoryEditor(code);
  const result = splitIfStatement({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });

  expect(result).toMatchObject({ action: "write", code: expected });
}
