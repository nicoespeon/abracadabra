import { Editor, ErrorReason, Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { convertIfElseToSwitch } from "./convert-if-else-to-switch";

describe("Convert If/Else to Switch", () => {
  let showErrorMessage: Editor["showError"];

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; selection?: Selection; expected: Code }>(
    "should convert if/else to switch",
    [
      {
        description: "simple conditional, strict equality",
        code: `if (name === "Jane") {
  sayHelloToJane();
} else if (name === "John") {
  sayHelloToJohn();
} else {
  sayHello();
}`,
        expected: `switch (name) {
case "Jane":
  sayHelloToJane();
  break;
case "John":
  sayHelloToJohn();
  break;
default:
  sayHello();
  break;
}`
      },
      {
        description: "simple conditional, loose equality",
        code: `if (name == "Jane") {
  sayHelloToJane();
} else if (name == "John") {
  sayHelloToJohn();
} else {
  sayHello();
}`,
        expected: `switch (name) {
case "Jane":
  sayHelloToJane();
  break;
case "John":
  sayHelloToJohn();
  break;
default:
  sayHello();
  break;
}`
      },
      {
        description: "simple conditional, mix of strict & loose equality",
        code: `if (name == "Jane") {
  sayHelloToJane();
} else if (name === "John") {
  sayHelloToJohn();
} else {
  sayHello();
}`,
        expected: `switch (name) {
case "Jane":
  sayHelloToJane();
  break;
case "John":
  sayHelloToJohn();
  break;
default:
  sayHello();
  break;
}`
      },
      {
        description: "convert the selected if-else only",
        code: `if (name === "Jane") {
  sayHelloToJane();
} else {
  sayHello();
}

if (name === "John") {
  sayHelloToJohn();
} else {
  sayHello();
}`,
        expected: `switch (name) {
case "Jane":
  sayHelloToJane();
  break;
default:
  sayHello();
  break;
}

if (name === "John") {
  sayHelloToJohn();
} else {
  sayHello();
}`
      },
      {
        description: "nested if-else, cursor on wrapper",
        code: `if (name === "Jane") {
  if (name === "John") {
    sayHelloToJohn();
  } else {
    sayHelloToJane();
  }
} else {
  sayHello();
}`,
        expected: `switch (name) {
case "Jane":
  if (name === "John") {
    sayHelloToJohn();
  } else {
    sayHelloToJane();
  }
  break;
default:
  sayHello();
  break;
}`
      },
      {
        description: "nested if-else, cursor on nested",
        code: `if (name === "Jane") {
  if (name === "John") {
    sayHelloToJohn();
  } else {
    sayHelloToJane();
  }
} else {
  sayHello();
}`,
        selection: Selection.cursorAt(1, 2),
        expected: `if (name === "Jane") {
  switch (name) {
  case "John":
    sayHelloToJohn();
    break;
  default:
    sayHelloToJane();
    break;
  }
} else {
  sayHello();
}`
      },
      {
        description: "without final else",
        code: `if (name === "Jane") {
  sayHelloToJane();
} else if (name === "John") {
  sayHelloToJohn();
}`,
        expected: `switch (name) {
case "Jane":
  sayHelloToJane();
  break;
case "John":
  sayHelloToJohn();
  break;
}`
      }
    ],
    async ({ code, selection = Selection.cursorAt(0, 0), expected }) => {
      const result = await doConvertIfElseToSwitch(code, selection);

      expect(result).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const selection = Selection.cursorAt(0, 0);

    await doConvertIfElseToSwitch(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundIfElseToConvert
    );
  });

  async function doConvertIfElseToSwitch(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const editor = new InMemoryEditor(code);
    editor.showError = showErrorMessage;
    await convertIfElseToSwitch(code, selection, editor);
    return editor.code;
  }
});
