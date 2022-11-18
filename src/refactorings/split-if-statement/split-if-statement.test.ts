import { Code, ErrorReason } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { splitIfStatement } from "./split-if-statement";

describe("Split If Statement", () => {
  testEach<{ code: Code; expected: Code }>(
    "should split if statement",
    [
      {
        description: "with && logical expression",
        code: `if (isValid && isCorrect) {
  doSomething();
}`,
        expected: `if (isValid) {
  if (isCorrect) {
    doSomething();
  }
}`
      },
      {
        description: "|| logical expression",
        code: `if (isValid || isCorrect) {
  doSomething();
}`,
        expected: `if (isValid) {
  doSomething();
} else if (isCorrect) {
  doSomething();
}`
      },
      {
        description: "multiple parts of logical expression",
        code: `if (isValid && isCorrect && shouldDoSomething) {
  doSomething();
}`,
        expected: `if (isValid && isCorrect) {
  if (shouldDoSomething) {
    doSomething();
  }
}`
      },
      {
        description: "composed logical expressions",
        code: `if (isValid && (isCorrect || shouldDoSomething)) {
  doSomething();
}`,
        expected: `if (isValid) {
  if ((isCorrect || shouldDoSomething)) {
    doSomething();
  }
}`
      },
      {
        description: "nested ifs, cursor on wrapper",
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
      },
      {
        description: "nested ifs, cursor on nested",
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
      },
      {
        description: "if/elseif/else pattern, && logical expression",
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
      },
      {
        description: "if/elseif/else pattern, || logical expression",
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
      },
      {
        description: "logical expression in elseif, cursor outside of elseif",
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
      },
      {
        description: "logical expression in elseif, cursor in elseif",
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
      },
      {
        description: "logical expression in elseif, n-th elseif",
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
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await splitIfStatement(editor);

      expect(editor.code).toBe(expected);
    }
  );

  it("should throw an error if logical expression can't be split", async () => {
    const code = `if ([cursor]isValid) {}`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await splitIfStatement(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindIfStatementToSplit
    );
  });

  it("should throw an error if logical expression is not in if statement", async () => {
    const code = `const isValid = size > 10 &[cursor]& isRequired;`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await splitIfStatement(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindIfStatementToSplit
    );
  });
});
