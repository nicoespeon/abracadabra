import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code, ErrorReason } from "../../editor/editor";
import { testEach } from "../../tests-helpers";
import { convertSwitchToIfElse } from "./convert-switch-to-if-else";

describe("Convert Switch To If Else", () => {
  testEach<{ code: Code; expected: Code }>(
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
      },
      {
        description: "with only a default statement",
        code: `switch (tempScore) {
  default:
    score += scores[tempScore];
    break;
}`,
        expected: `score += scores[tempScore];`
      },
      {
        description: "with only a case statement",
        code: `switch (tempScore) {
  case 12:
    score += scores[tempScore];
    break;
}`,
        expected: `if (tempScore === 12) {
  score += scores[tempScore];
}`
      },
      {
        description: "preserves comments",
        code: `// leading comment
[cursor]switch (name) {
case "Jane":
  sayHelloToJane();
  break;
default:
  sayHello();
  break;
}
// trailing comment`,
        expected: `// leading comment
if (name === "Jane") {
  sayHelloToJane();
} else {
  sayHello();
}
// trailing comment`
      },
      {
        description:
          "preserves comments if switch only contains default statement",
        code: `// leading comment
[cursor]switch (tempScore) {
  default:
    score += scores[tempScore];
    break;
}
// trailing comment`,
        expected: `// leading comment
score += scores[tempScore];
// trailing comment`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await convertSwitchToIfElse(editor);

      expect(editor.code).toBe(expected);
    }
  );

  testEach<{ code: Code }>(
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
    async ({ code }) => {
      const editor = new InMemoryEditor(code);
      const originalCode = editor.code;

      await convertSwitchToIfElse(editor);

      expect(editor.code).toBe(originalCode);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await convertSwitchToIfElse(editor);

    expect(editor.showError).toHaveBeenCalledWith(
      ErrorReason.DidNotFindSwitchToConvert
    );
  });
});
