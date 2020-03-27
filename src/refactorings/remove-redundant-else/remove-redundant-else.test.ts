import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { removeRedundantElse } from "./remove-redundant-else";

describe("Remove Redundant Else", () => {
  let showErrorMessage: Editor["showError"];

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; selection: Selection; expected: Code }>(
    "should remove redundant else",
    [
      {
        description: "basic scenario",
        code: `function doSomethingIfValid() {
  console.log("Start working");

  if (!isValid) {
    showWarning();
    return;
  } else {
    doSomething();
    doAnotherThing();
  }

  doSomeFinalThing();
}`,
        selection: new Selection([3, 3], [9, 3]),
        expected: `function doSomethingIfValid() {
  console.log("Start working");

  if (!isValid) {
    showWarning();
    return;
  }

  doSomething();
  doAnotherThing();

  doSomeFinalThing();
}`
      },
      {
        description: "only the selected one",
        code: `function doSomethingIfValid() {
  if (!isValid) {
    showWarning();
    return;
  } else {
    doSomething();
    doAnotherThing();
  }

  if (!isCorrect) {
    showWarning();
    return;
  } else {
    showMessage();
  }
}`,
        selection: new Selection([1, 3], [7, 3]),
        expected: `function doSomethingIfValid() {
  if (!isValid) {
    showWarning();
    return;
  }

  doSomething();
  doAnotherThing();

  if (!isCorrect) {
    showWarning();
    return;
  } else {
    showMessage();
  }
}`
      },
      {
        description: "when cursor is inside",
        code: `function doSomethingIfValid() {
  if (!isValid) {
    showWarning();
    return;
  } else {
    doSomething();
    doAnotherThing();
  }
}`,
        selection: Selection.cursorAt(3, 3),
        expected: `function doSomethingIfValid() {
  if (!isValid) {
    showWarning();
    return;
  }
  doSomething();
  doAnotherThing();
}`
      },
      {
        description: "with throw expression",
        code: `function doSomethingIfValid() {
  if (!isValid) {
    throw new Error("Oh no!");
  } else {
    doSomething();
    doAnotherThing();
  }
}`,
        selection: Selection.cursorAt(3, 3),
        expected: `function doSomethingIfValid() {
  if (!isValid) {
    throw new Error("Oh no!");
  }
  doSomething();
  doAnotherThing();
}`
      },
      {
        description: "with else if",
        code: `function doSomethingIfValid() {
  if (!isValid) {
    throw new Error("Oh no!");
  } else if (isCorrect) {
    doSomething();
  } else {
    doAnotherThing();
  }
}`,
        selection: Selection.cursorAt(2, 4),
        expected: `function doSomethingIfValid() {
  if (!isValid) {
    throw new Error("Oh no!");
  }
  if (isCorrect) {
    doSomething();
  } else {
    doAnotherThing();
  }
}`
      },
      {
        description: "nested, cursor on wrapper",
        code: `function doSomethingIfValid() {
  if (!isValid) {
    if (shouldShowWarning) {
      showWarning();
      return;
    } else {
      doNothing();
    }
    return;
  } else {
    doSomething();
  }
}`,
        selection: Selection.cursorAt(1, 2),
        expected: `function doSomethingIfValid() {
  if (!isValid) {
    if (shouldShowWarning) {
      showWarning();
      return;
    } else {
      doNothing();
    }
    return;
  }
  doSomething();
}`
      },
      {
        description: "nested, cursor on nested",
        code: `function doSomethingIfValid() {
  if (!isValid) {
    if (shouldShowWarning) {
      showWarning();
      return;
    } else {
      doNothing();
    }
    return;
  } else {
    doSomething();
  }
}`,
        selection: Selection.cursorAt(2, 4),
        expected: `function doSomethingIfValid() {
  if (!isValid) {
    if (shouldShowWarning) {
      showWarning();
      return;
    }
    doNothing();
    return;
  } else {
    doSomething();
  }
}`
      },

      {
        description: "invalid nested, cursor on nested",
        code: `function doSomethingIfValid() {
  if (!isValid) {
    if (shouldShowWarning) {
      showWarning();
    }
    return;
  } else {
    doSomething();
  }
}`,
        selection: Selection.cursorAt(2, 4),
        expected: `function doSomethingIfValid() {
  if (!isValid) {
    if (shouldShowWarning) {
      showWarning();
    }
    return;
  }
  doSomething();
}`
      }
    ],
    async ({ code, selection, expected }) => {
      const result = await doRemoveRedundantElse(code, selection);

      expect(result).toBe(expected);
    }
  );

  it("should show an error message if selection has no redundant else", async () => {
    const code = `if (!isValid) {
  showWarning();
} else {
  doSomething();
  doAnotherThing();
}`;
    const selection = new Selection([0, 0], [5, 1]);

    await doRemoveRedundantElse(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFindRedundantElse
    );
  });

  async function doRemoveRedundantElse(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const editor = new InMemoryEditor(code);
    editor.showError = showErrorMessage;
    await removeRedundantElse(code, selection, editor);
    return editor.code;
  }
});
