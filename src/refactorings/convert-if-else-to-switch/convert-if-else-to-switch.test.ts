import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code } from "../../editor/editor";
import { convertIfElseToSwitch } from "./convert-if-else-to-switch";

// Compact indentation of generated switch statement is due to recast behaviour:
// https://github.com/benjamn/recast/issues/180

describe("Convert If/Else to Switch", () => {
  describe("should convert if/else to switch", () => {
    it("simple conditional, strict equality", () => {
      shouldConvertIfElseToSwitch({
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
      });
    });

    it("simple conditional, loose equality", () => {
      shouldConvertIfElseToSwitch({
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
      });
    });

    it("simple conditional, mix of strict & loose equality", () => {
      shouldConvertIfElseToSwitch({
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
      });
    });

    it("simple conditional, inverted discriminant & test", () => {
      shouldConvertIfElseToSwitch({
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
      });
    });

    it("convert the selected if-else only", () => {
      shouldConvertIfElseToSwitch({
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
      });
    });

    it("nested if-else, cursor on wrapper", () => {
      shouldConvertIfElseToSwitch({
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
      });
    });

    it("nested if-else, cursor on nested", () => {
      shouldConvertIfElseToSwitch({
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
      });
    });

    it("without final else", () => {
      shouldConvertIfElseToSwitch({
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
      });
    });

    it("with return statements", () => {
      shouldConvertIfElseToSwitch({
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
      });
    });

    it("with member expression as discriminant", () => {
      shouldConvertIfElseToSwitch({
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
      });
    });

    it("preserves comments", () => {
      shouldConvertIfElseToSwitch({
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
      });
    });
  });

  describe("should not convert", () => {
    it("different discriminants", () => {
      shouldNotConvert(`if (name === "Jane") {
  sayHelloToJane();
} else if (surname === "John") {
  sayHelloToJohn();
} else {
  sayHello();
}`);
    });

    it("invalid operators", () => {
      shouldNotConvert(`if (name >= "Jane") {
  sayHelloToJane();
} else if (name >= "John") {
  sayHelloToJohn();
} else {
  sayHello();
}`);
    });

    it("different operators", () => {
      shouldNotConvert(`if (name !== "Jane") {
  sayHelloToJane();
} else if (name === "John") {
  sayHelloToJohn();
} else {
  sayHello();
}`);
    });

    it("unary expressions", () => {
      shouldNotConvert(`if (!(name === "Jane")) {
  sayHelloToJane();
} else if (!(name === "John")) {
  sayHelloToJohn();
} else {
  sayHello();
}`);
    });

    it("logical expressions", () => {
      shouldNotConvert(`if (name === "Jane" && age > 10) {
  sayHelloToJane();
} else if (name === "John") {
  sayHelloToJohn();
} else {
  sayHello();
}`);
    });
  });

  it("should show an error message if refactoring can't be made", () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    const result = convertIfElseToSwitch({
      state: "new",
      code: editor.code,
      selection: editor.selection
    });

    expect(result.action).toBe("show error");
  });
});

function shouldConvertIfElseToSwitch({
  code,
  expected
}: {
  code: Code;
  expected: Code;
}) {
  const editor = new InMemoryEditor(code);
  const result = convertIfElseToSwitch({
    state: "new",
    code: editor.code,
    selection: editor.selection
  });

  expect(result).toMatchObject({ action: "write", code: expected });
}

function shouldNotConvert(code: Code) {
  const editor = new InMemoryEditor(code);
  const result = convertIfElseToSwitch({
    state: "new",
    code: editor.code,
    selection: editor.selection
  });

  expect(result.action).toBe("show error");
}
