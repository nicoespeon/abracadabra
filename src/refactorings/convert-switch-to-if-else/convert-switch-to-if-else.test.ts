import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code } from "../../editor/editor";
import { convertSwitchToIfElse } from "./convert-switch-to-if-else";

describe("Convert Switch To If Else", () => {
  describe("should convert switch to if else", () => {
    it("simple switch", () => {
      shouldConvertSwitchToIfElse({
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
      });
    });

    it("empty fall-throughs", () => {
      shouldConvertSwitchToIfElse({
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
      });
    });

    it("convert the selected switch only", () => {
      shouldConvertSwitchToIfElse({
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
      });
    });

    it("without default case", () => {
      shouldConvertSwitchToIfElse({
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
      });
    });

    it("default case without break", () => {
      shouldConvertSwitchToIfElse({
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
      });
    });

    it("last case without break", () => {
      shouldConvertSwitchToIfElse({
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
      });
    });

    it("with return statements", () => {
      shouldConvertSwitchToIfElse({
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
      });
    });

    it("with return statements and fallthrough", () => {
      shouldConvertSwitchToIfElse({
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
      });
    });

    it("with only a default statement", () => {
      shouldConvertSwitchToIfElse({
        code: `switch (tempScore) {
  default:
    score += scores[tempScore];
    break;
}`,
        expected: `score += scores[tempScore];`
      });
    });

    it("with only a case statement", () => {
      shouldConvertSwitchToIfElse({
        code: `switch (tempScore) {
  case 12:
    score += scores[tempScore];
    break;
}`,
        expected: `if (tempScore === 12) {
  score += scores[tempScore];
}`
      });
    });

    it("preserves comments", () => {
      shouldConvertSwitchToIfElse({
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
      });
    });

    it("preserves comments if switch only contains default statement", () => {
      shouldConvertSwitchToIfElse({
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
      });
    });
  });

  describe("should not convert", () => {
    it("non-empty case without break", () => {
      shouldNotConvert(`switch (name) {
case "Jane":
  sayHelloToJane();
  break;
case "John":
  sayHelloToJohn();
default:
  sayHello();
}`);
    });

    it("default case not last", () => {
      shouldNotConvert(`switch (name) {
case "Jane":
  sayHelloToJane();
  break;
default:
  sayHello();
  break;
case "John":
  sayHelloToJohn();
  break;
}`);
    });

    it("a mix of return statements and regular ones", () => {
      shouldNotConvert(`switch (name) {
case "Jane":
  return sayHelloToJane();
case "Johnny":
  sayHelloToJohn();
default:
  sayHello();
}`);
    });
  });

  it("should show an error message if refactoring can't be made", () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    const result = convertSwitchToIfElse({
      state: "new",
      code: editor.code,
      selection: editor.selection
    });

    expect(result.action).toBe("show error");
  });
});

function shouldConvertSwitchToIfElse({
  code,
  expected
}: {
  code: Code;
  expected: Code;
}) {
  const editor = new InMemoryEditor(code);
  const result = convertSwitchToIfElse({
    state: "new",
    code: editor.code,
    selection: editor.selection
  });

  expect(result).toMatchObject({ action: "write", code: expected });
}

function shouldNotConvert(code: Code) {
  const editor = new InMemoryEditor(code);
  const result = convertSwitchToIfElse({
    state: "new",
    code: editor.code,
    selection: editor.selection
  });

  expect(result.action).toBe("show error");
}
