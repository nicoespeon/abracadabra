import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code, ErrorReason } from "../../editor/editor";
import { testEach } from "../../tests-helpers";
import { convertIfElseToSwitch } from "./convert-if-else-to-switch";

// Compact indentation of generated switch statement is due to recast behaviour:
// https://github.com/benjamn/recast/issues/180

describe("Convert If/Else to Switch", () => {
  testEach<{ code: Code; expected: Code }>(
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
        description: "simple conditional, inverted discriminant & test",
        code: `if (name === "Jane") {
  sayHelloToJane();
} else if ("John" === name) {
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
  [cursor]if (name === "John") {
    sayHelloToJohn();
  } else {
    sayHelloToJane();
  }
} else {
  sayHello();
}`,
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
      },
      {
        description: "with return statements",
        code: `if (name === "Jane") {
  return sayHelloToJane();
} else if (name === "John") {
  return sayHelloToJohn();
} else {
  return sayHello();
}`,
        expected: `switch (name) {
case "Jane":
  return sayHelloToJane();
case "John":
  return sayHelloToJohn();
default:
  return sayHello();
}`
      },
      {
        description: "with member expression as discriminant",
        code: `if (item.name === "Jane") {
  return sayHelloToJane();
} else if (item.name === "John") {
  return sayHelloToJohn();
} else {
  return sayHello();
}`,
        expected: `switch (item.name) {
case "Jane":
  return sayHelloToJane();
case "John":
  return sayHelloToJohn();
default:
  return sayHello();
}`
      },
      {
        description: "preserves comments",
        code: `// leading comment
[cursor]if (name === "Jane") {
  sayHelloToJane();
} else if (name === "John") {
  sayHelloToJohn();
} else {
  sayHello();
}
// trailing comment`,
        expected: `// leading comment
switch (name) {
case "Jane":
  sayHelloToJane();
  break;
case "John":
  sayHelloToJohn();
  break;
default:
  sayHello();
  break;
}
// trailing comment`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await convertIfElseToSwitch(editor);

      expect(editor.code).toBe(expected);
    }
  );

  testEach<{ code: Code }>(
    "should not convert",
    [
      {
        description: "different discriminants",
        code: `if (name === "Jane") {
  sayHelloToJane();
} else if (surname === "John") {
  sayHelloToJohn();
} else {
  sayHello();
}`
      },
      {
        description: "invalid operators",
        code: `if (name >= "Jane") {
  sayHelloToJane();
} else if (name >= "John") {
  sayHelloToJohn();
} else {
  sayHello();
}`
      },
      {
        description: "different operators",
        code: `if (name !== "Jane") {
  sayHelloToJane();
} else if (name === "John") {
  sayHelloToJohn();
} else {
  sayHello();
}`
      },
      {
        description: "unary expressions",
        code: `if (!(name === "Jane")) {
  sayHelloToJane();
} else if (!(name === "John")) {
  sayHelloToJohn();
} else {
  sayHello();
}`
      },
      {
        description: "logical expressions",
        code: `if (name === "Jane" && age > 10) {
  sayHelloToJane();
} else if (name === "John") {
  sayHelloToJohn();
} else {
  sayHello();
}`
      }
    ],
    async ({ code }) => {
      const editor = new InMemoryEditor(code);
      const originalCode = editor.code;

      await convertIfElseToSwitch(editor);

      expect(editor.code).toBe(originalCode);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await convertIfElseToSwitch(editor);

    expect(editor.showError).toHaveBeenCalledWith(
      ErrorReason.DidNotFindIfElseToConvert
    );
  });
});
