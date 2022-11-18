import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code, ErrorReason } from "../../editor/editor";
import { testEach } from "../../tests-helpers";

import { flipIfElse } from "./flip-if-else";

describe("Flip If/Else", () => {
  testEach<{ code: Code; expected: Code }>(
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
        description: "no else branch",
        code: `if (isValid) {
  doSomething();
}

doSomethingElse();`,
        expected: `if (!isValid) {} else {
  doSomething();
}

doSomethingElse();`
      },
      {
        description:
          "no else branch and no other statement after (turn into guard clause)",
        code: `doSomethingFirst();

[cursor]if (isValid) {
  doSomething();
}`,
        expected: `doSomethingFirst();

if (!isValid) return;
doSomething();`
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
  [cursor]if (isVIP) {
    doSomethingForVIP();
  } else {
    doSomething();
  }
} else {
  doAnotherThing();
}`,
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
if (!isValid) re[cursor]turn;

doSomething();
doSomethingElse();`,
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
      },
      {
        description: "guard clause in a loop",
        code: `for (let index = 0; index < 5; index++) {
  if (index > 2) [cursor]console.log(index);
}`,
        expected: `for (let index = 0; index < 5; index++) {
  if (index <= 2) {
    continue;
  }
  console.log(index);
}`
      },
      {
        description: "if-else with return statements",
        code: `if (!isValid) {
  return doSomething();
} else {
  return doAnotherThing();
}`,
        expected: `if (isValid) {
  return doAnotherThing();
} else {
  return doSomething();
}`
      },
      {
        description: "instanceof",
        code: `if (data instanceof Item) {
  doSomething();
} else {
  doAnotherThing();
}`,
        expected: `if (!(data instanceof Item)) {
  doAnotherThing();
} else {
  doSomething();
}`
      },
      {
        description: "preserve parentheses",
        code: `if (false && (false || true)) {
  console.log('true');
} else {
  console.log('false');
}`,
        expected: `if (!(false && (false || true))) {
  console.log('false');
} else {
  console.log('true');
}`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await flipIfElse(editor);

      expect(editor.code).toBe(expected);
    }
  );

  it("should show an error message if selection has no if statement", async () => {
    const code = `console.log("no if statement")`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await flipIfElse(editor);

    expect(editor.showError).toBeCalledWith(ErrorReason.DidNotFindIfElseToFlip);
  });
});
