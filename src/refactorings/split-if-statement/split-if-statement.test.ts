import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { splitIfStatement } from "./split-if-statement";

describe("Split If Statement", () => {
  let showErrorMessage: Editor["showError"];

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
      },
      {
        description: "logical expression in elseif, cursor outside of elseif",
        code: `if (isValid || isCorrect) {
  doSomething();
} else if (isSelected && shouldDoAnotherThing) {
  doAnotherThing();
} else {
  doNothing();
}`,
        selection: Selection.cursorAt(1, 0),
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
  doAnotherThing();
} else {
  doNothing();
}`,
        selection: Selection.cursorAt(3, 0),
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
  doNothing();
}`,
        selection: Selection.cursorAt(5, 0),
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
      ErrorReason.DidNotFindIfStatementToSplit
    );
  });

  it("should throw an error if logical expression is not in if statement", async () => {
    const code = `const isValid = size > 10 && isRequired;`;
    const selection = Selection.cursorAt(0, 27);

    await doSplitIfStatement(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFindIfStatementToSplit
    );
  });

  async function doSplitIfStatement(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const editor = new InMemoryEditor(code);
    editor.showError = showErrorMessage;
    await splitIfStatement(code, selection, editor);
    return editor.code;
  }
});
