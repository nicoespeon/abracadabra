import { Code, ErrorReason } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { removeRedundantElse } from "./remove-redundant-else";

describe("Remove Redundant Else", () => {
  testEach<{ code: Code; expected: Code }>(
    "should remove redundant else",
    [
      {
        description: "basic scenario",
        code: `function doSomethingIfValid() {
  console.log("Start working");

  i[start]f (!isValid) {
    showWarning();
    return;
  } else {
    doSomething();
    doAnotherThing();
  }[end]

  doSomeFinalThing();
}`,
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
        description: "basic scenario with tabs",
        code: `function doSomethingIfValid() {
\t[start]if (!isValid) {
\t\tshowWarning();
\t\treturn;
\t} else {
\t\tdoSomething();
\t}[end]
}`,
        expected: `function doSomethingIfValid() {
\tif (!isValid) {
\t\tshowWarning();
\t\treturn;
\t}
\tdoSomething();
}`
      },
      {
        description: "only the selected one",
        code: `function doSomethingIfValid() {
  i[start]f (!isValid) {
    showWarning();
    return;
  } else {
    doSomething();
    doAnotherThing();
  }[end]

  if (!isCorrect) {
    showWarning();
    return;
  } else {
    showMessage();
  }
}`,
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
    [cursor]return;
  } else {
    doSomething();
    doAnotherThing();
  }
}`,
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
  }[cursor] else {
    doSomething();
    doAnotherThing();
  }
}`,
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
    [cursor]throw new Error("Oh no!");
  } else if (isCorrect) {
    doSomething();
  } else {
    doAnotherThing();
  }
}`,
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
  [cursor]if (!isValid) {
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
    [cursor]if (shouldShowWarning) {
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
    [cursor]if (shouldShowWarning) {
      showWarning();
    }
    return;
  } else {
    doSomething();
  }
}`,
        expected: `function doSomethingIfValid() {
  if (!isValid) {
    if (shouldShowWarning) {
      showWarning();
    }
    return;
  }
  doSomething();
}`
      },
      {
        description: "if has no braces",
        code: `function doSomethingIfValid() {
  if (!isValid)[cursor]
    return;
  else if (isMorning)
    return;
}`,
        expected: `function doSomethingIfValid() {
  if (!isValid)
    return;
  if (isMorning)
    return;
}`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await removeRedundantElse(editor);

      expect(editor.code).toBe(expected);
    }
  );

  it("should show an error message if selection has no redundant else", async () => {
    const code = `[start]if (!isValid) {
  showWarning();
} else {
  doSomething();
  doAnotherThing();
}[end]`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await removeRedundantElse(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindRedundantElse
    );
  });
});
