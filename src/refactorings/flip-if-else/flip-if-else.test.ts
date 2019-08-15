import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { flipIfElse } from "./flip-if-else";

describe("Flip If/Else", () => {
  let showErrorMessage: Editor["showError"];

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; selection?: Selection; expected: Code }>(
    "should flip if and else branch",
    [
      {
        description: "basic scenario",
        code: `if (isValid) {
  doSomething();
} else {
  doAnotherThing();
}`,
        expected: `if (!isValid) {
  doAnotherThing();
} else {
  doSomething();
}`
      },
      {
        description: "else branch doesn't exist yet",
        code: `if (isValid) {
  doSomething();
}`,
        expected: `if (!isValid) {} else {
  doSomething();
}`
      },
      {
        description: "an already flipped if statement",
        code: `if (!isValid) {
  doAnotherThing();
} else {
  doSomething();
}`,
        expected: `if (isValid) {
  doSomething();
} else {
  doAnotherThing();
}`
      },
      {
        description: "an if statement with a binary expression",
        code: `if (a > b) {
  doAnotherThing();
} else {
  doSomething();
}`,
        expected: `if (a <= b) {
  doSomething();
} else {
  doAnotherThing();
}`
      },
      {
        description: "an if statement with else-ifs",
        code: `if (a > b) {
  doSomething();
} else if (a === 10) {
  doSomethingWith(a);
} else if (b === 10) {
  doSomethingWith(b);
} else {
  doNothing();
}`,
        expected: `if (a <= b) {
  if (a === 10) {
    doSomethingWith(a);
  } else if (b === 10) {
    doSomethingWith(b);
  } else {
    doNothing();
  }
} else {
  doSomething();
}`
      },
      {
        description: "nested, cursor on wrapper",
        code: `if (isValid) {
  if (isVIP) {
    doSomethingForVIP();
  } else {
    doSomething();
  }
} else {
  doAnotherThing();
}`,
        expected: `if (!isValid) {
  doAnotherThing();
} else {
  if (isVIP) {
    doSomethingForVIP();
  } else {
    doSomething();
  }
}`
      },
      {
        description: "nested, cursor on nested",
        code: `if (isValid) {
  if (isVIP) {
    doSomethingForVIP();
  } else {
    doSomething();
  }
} else {
  doAnotherThing();
}`,
        selection: Selection.cursorAt(1, 2),
        expected: `if (isValid) {
  if (!isVIP) {
    doSomething();
  } else {
    doSomethingForVIP();
  }
} else {
  doAnotherThing();
}`
      },
      {
        description: "guard clause",
        code: `if (!isValid) return;

doSomething();
doSomethingElse();`,
        expected: `if (isValid) {
  doSomething();
  doSomethingElse();
}`
      },
      {
        description: "guard clause with block statement",
        code: `if (!isValid) {
  return;
}

doSomething();
doSomethingElse();`,
        expected: `if (isValid) {
  doSomething();
  doSomethingElse();
}`
      },
      {
        description: "guard clause with other statements in block",
        code: `if (!isValid) {
  console.log("Hello");
  return;
}

doSomething();
doSomethingElse();`,
        expected: `if (isValid) {
  doSomething();
  doSomethingElse();
} else {
  console.log("Hello");
}`
      },
      {
        description: "guard clause with other statements above",
        code: `console.log("Hello");
if (!isValid) return;

doSomething();
doSomethingElse();`,
        selection: Selection.cursorAt(1, 16),
        expected: `console.log("Hello");
if (isValid) {
  doSomething();
  doSomethingElse();
}`
      },
      {
        description: "guard clause with returned value",
        code: `if (!isValid) return null;

doSomething();
doSomethingElse();`,
        expected: `if (isValid) {
  doSomething();
  doSomethingElse();
} else {
  return null;
}`
      },
      {
        description: "guard clause with returned value in block",
        code: `if (!isValid) {
  return null;
}

doSomething();
doSomethingElse();`,
        expected: `if (isValid) {
  doSomething();
  doSomethingElse();
} else {
  return null;
}`
      }
      // TODO: other nodes than statements after the guard?
    ],
    async ({ code, selection = Selection.cursorAt(0, 0), expected }) => {
      const result = await doFlipIfElse(code, selection);

      expect(result).toBe(expected);
    }
  );

  it("should show an error message if selection has no if statement", async () => {
    const code = `console.log("no if statement")`;
    const selection = Selection.cursorAt(0, 0);

    await doFlipIfElse(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundIfElseToFlip
    );
  });

  async function doFlipIfElse(code: Code, selection: Selection): Promise<Code> {
    const editor = new InMemoryEditor(code);
    editor.showError = showErrorMessage;
    await flipIfElse(code, selection, editor);
    return editor.code;
  }
});
