import { Code } from "../../editor/i-write-code";
import { Selection } from "../../editor/selection";
import {
  ShowErrorMessage,
  ErrorReason
} from "../../editor/i-show-error-message";
import { createWriteInMemory } from "../../editor/adapters/write-code-in-memory";
import { splitIfStatement } from "./split-if-statement";
import { testEach } from "../../tests-helpers";

describe("Split If Statement", () => {
  let showErrorMessage: ShowErrorMessage;

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; selection?: Selection; expected: Code }>(
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
  if (isCorrect || shouldDoSomething) {
    doSomething();
  }
}`
      },
      {
        description: "nested ifs, cursor on wrapper",
        code: `if (isValid && size > 10) {
  if (isCorrect || shouldDoSomething) {
    doSomething();
  }
}`,
        selection: Selection.cursorAt(0, 4),
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
    doSomething();
  }
}`,
        selection: Selection.cursorAt(2, 4),
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
      }
    ],
    async ({ code, selection = Selection.cursorAt(0, 0), expected }) => {
      const result = await doSplitIfStatement(code, selection);

      expect(result).toBe(expected);
    }
  );

  it("should throw an error if logical expression can't be split", async () => {
    const code = `if (isValid) {}`;
    const selection = Selection.cursorAt(0, 4);

    await doSplitIfStatement(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundIfStatementToSplit
    );
  });

  it("should throw an error if logical expression is not in if statement", async () => {
    const code = `const isValid = size > 10 && isRequired;`;
    const selection = Selection.cursorAt(0, 27);

    await doSplitIfStatement(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundIfStatementToSplit
    );
  });

  async function doSplitIfStatement(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const [write, getState] = createWriteInMemory(code);
    await splitIfStatement(code, selection, write, showErrorMessage);
    return getState().code;
  }
});
