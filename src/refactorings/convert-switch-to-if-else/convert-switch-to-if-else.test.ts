import { Editor, ErrorReason, Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { convertSwitchToIfElse } from "./convert-switch-to-if-else";

describe("Convert Switch To If Else", () => {
  let showErrorMessage: Editor["showError"];

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; selection?: Selection; expected: Code }>(
    "should convert switch to if else",
    [
      {
        description: "simple switch",
        code: `switch (name) {
case "Jane":
  sayHelloToJane();
  break;
case "John":
  sayHelloToJohn();
  break;
default:
  sayHello();
  break;
}`,
        expected: `if (name === "Jane") {
  sayHelloToJane();
} else if (name === "John") {
  sayHelloToJohn();
} else {
  sayHello();
}`
      },
      {
        description: "empty fall-throughs",
        code: `switch (name) {
case "Jane":
  sayHelloToJane();
  break;
case "Joe":
case "Joseph":
  sayHelloToJoe();
  break;
case "John":
case "Johnny":
case "Johnie":
  sayHelloToJohn();
  break;
case "Jack":
case "Jacob":
case "Jackie":
case "Jake":
  sayHelloToJack();
  break;
default:
  sayHello();
  break;
}`,
        expected: `if (name === "Jane") {
  sayHelloToJane();
} else if (name === "Joe" || name === "Joseph") {
  sayHelloToJoe();
} else if (name === "John" || (name === "Johnny" || name === "Johnie")) {
  sayHelloToJohn();
} else if (name === "Jack" || (name === "Jacob" || (name === "Jackie" || name === "Jake"))) {
  sayHelloToJack();
} else {
  sayHello();
}`
      },
      {
        description: "convert the selected switch only",
        code: `switch (name) {
case "Jane":
  sayHelloToJane();
  break;
default:
  sayHello();
  break;
}

switch (name) {
case "John":
  sayHelloToJohn();
  break;
default:
  sayHello();
  break;
}`,
        expected: `if (name === "Jane") {
  sayHelloToJane();
} else {
  sayHello();
}

switch (name) {
case "John":
  sayHelloToJohn();
  break;
default:
  sayHello();
  break;
}`
      },
      {
        description: "without default case",
        code: `switch (name) {
case "Jane":
  sayHelloToJane();
  break;
case "John":
  sayHelloToJohn();
  break;
}`,
        expected: `if (name === "Jane") {
  sayHelloToJane();
} else if (name === "John") {
  sayHelloToJohn();
}`
      },
      {
        description: "default case without break",
        code: `switch (name) {
case "Jane":
  sayHelloToJane();
  break;
default:
  sayHello();
}`,
        expected: `if (name === "Jane") {
  sayHelloToJane();
} else {
  sayHello();
}`
      },
      {
        description: "last case without break",
        code: `switch (name) {
case "Jane":
  sayHelloToJane();
  break;
case "John":
  sayHelloToJohn();
}`,
        expected: `if (name === "Jane") {
  sayHelloToJane();
} else if (name === "John") {
  sayHelloToJohn();
}`
      },
      {
        description: "with return statements",
        code: `switch (name) {
case "Jane":
  return sayHelloToJane();
case "John":
  return sayHelloToJohn();
default:
  return sayHello();
}`,
        expected: `if (name === "Jane") {
  return sayHelloToJane();
}

if (name === "John") {
  return sayHelloToJohn();
}

return sayHello();`
      },
      {
        description: "with return statements and fallthrough",
        code: `switch (name) {
case "Jane":
  return sayHelloToJane();
case "John":
case "Johnny":
  return sayHelloToJohn();
default:
  return sayHello();
}`,
        expected: `if (name === "Jane") {
  return sayHelloToJane();
}

if (name === "John" || name === "Johnny") {
  return sayHelloToJohn();
}

return sayHello();`
      }
    ],
    async ({ code, selection = Selection.cursorAt(0, 0), expected }) => {
      const result = await doConvertSwitchToIfElse(code, selection);

      expect(result).toBe(expected);
    }
  );

  testEach<{ code: Code; selection?: Selection }>(
    "should not convert",
    [
      {
        description: "non-empty case without break",
        code: `switch (name) {
case "Jane":
  sayHelloToJane();
  break;
case "John":
  sayHelloToJohn();
default:
  sayHello();
}`
      },
      {
        description: "default case not last",
        code: `switch (name) {
case "Jane":
  sayHelloToJane();
  break;
default:
  sayHello();
  break;
case "John":
  sayHelloToJohn();
  break;
}`
      },
      {
        description: "a mix of return statements and regular ones",
        code: `switch (name) {
case "Jane":
  return sayHelloToJane();
case "Johnny":
  sayHelloToJohn();
default:
  sayHello();
}`
      }
    ],
    async ({ code, selection = Selection.cursorAt(0, 0) }) => {
      const result = await doConvertSwitchToIfElse(code, selection);

      expect(result).toBe(code);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const selection = Selection.cursorAt(0, 0);

    await doConvertSwitchToIfElse(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFindSwitchToConvert
    );
  });

  async function doConvertSwitchToIfElse(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const editor = new InMemoryEditor(code);
    editor.showError = showErrorMessage;
    await convertSwitchToIfElse(code, selection, editor);
    return editor.code;
  }
});
