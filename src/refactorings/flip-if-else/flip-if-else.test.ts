import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code } from "../../editor/editor";
import { flipIfElse } from "./flip-if-else";

describe("Flip If/Else", () => {
  describe("should flip if and else branch", () => {
    it("basic scenario", () => {
      shouldFlipIfElse({
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
      });
    });

    it("no else branch", () => {
      shouldFlipIfElse({
        code: `if (isValid) {
  doSomething();
}

doSomethingElse();`,
        expected: `if (!isValid) {} else {
  doSomething();
}

doSomethingElse();`
      });
    });

    it("no else branch and no other statement after (turn into guard clause)", () => {
      shouldFlipIfElse({
        code: `doSomethingFirst();

[cursor]if (isValid) {
  doSomething();
}`,
        expected: `doSomethingFirst();

if (!isValid) return;
doSomething();`
      });
    });

    it("an already flipped if statement", () => {
      shouldFlipIfElse({
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
      });
    });

    it("an if statement with a binary expression", () => {
      shouldFlipIfElse({
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
      });
    });

    it("an if statement with else-ifs", () => {
      shouldFlipIfElse({
        code: `if (a > b) {
  doSomething();
} else if (a === 10) {
  doSomethingWith(a);
} else {
  doAnotherThing();
}`,
        expected: `if (a <= b) {
  if (a === 10) {
    doSomethingWith(a);
  } else {
    doAnotherThing();
  }
} else {
  doSomething();
}`
      });
    });

    it("nested, cursor on wrapper", () => {
      shouldFlipIfElse({
        code: `if (isValid) {
  if (isCorrect) {
    doSomething();
  } else {
    doAnotherThing();
  }
} else {
  doSomethingElse();
}`,
        expected: `if (!isValid) {
  doSomethingElse();
} else {
  if (isCorrect) {
    doSomething();
  } else {
    doAnotherThing();
  }
}`
      });
    });

    it("nested, cursor on nested", () => {
      shouldFlipIfElse({
        code: `if (isValid) {
  if (is[cursor]Correct) {
    doSomething();
  } else {
    doAnotherThing();
  }
} else {
  doSomethingElse();
}`,
        expected: `if (isValid) {
  if (!isCorrect) {
    doAnotherThing();
  } else {
    doSomething();
  }
} else {
  doSomethingElse();
}`
      });
    });

    it("if-else with return statements", () => {
      shouldFlipIfElse({
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
      });
    });

    it("with instanceof operator", () => {
      shouldFlipIfElse({
        code: `if (day instanceof Morning) {
  sayGoodMorning();
} else {
  sayHello();
}`,
        expected: `if (!(day instanceof Morning)) {
  sayHello();
} else {
  sayGoodMorning();
}`
      });
    });

    it("preserve parentheses", () => {
      shouldFlipIfElse({
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
      });
    });

    it("don't mess up return statements when not using ';'", () => {
      shouldFlipIfElse({
        code: `const obj = {
  m1() {
    const result = Math.random()
    return result
  },
  m2() {
    if (Math.random() < 0.5) {[cursor]
      // 1
    } else {
      // 2
    }
  },
}`,
        expected: `const obj = {
  m1() {
    const result = Math.random()
    return result
  },
  m2() {
    if (Math.random() >= 0.5) {
      // 2
    } else {
      // 1
    }
  },
}`
      });
    });
  });

  describe("should flip guard clause", () => {
    it("basic scenario", () => {
      shouldFlipIfElse({
        code: `if (!isValid) return;

doSomething();
doSomethingElse();`,
        expected: `if (isValid) {
  doSomething();
  doSomethingElse();
}`
      });
    });

    it("with block statement", () => {
      shouldFlipIfElse({
        code: `if (!isValid) {
  return;
}

doSomething();
doSomethingElse();`,
        expected: `if (isValid) {
  doSomething();
  doSomethingElse();
}`
      });
    });

    it("with other statements in block", () => {
      shouldFlipIfElse({
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
      });
    });

    it("with other statements above", () => {
      shouldFlipIfElse({
        code: `console.log("Hello");
if (!isValid) re[cursor]turn;

doSomething();
doSomethingElse();`,
        expected: `console.log("Hello");
if (isValid) {
  doSomething();
  doSomethingElse();
}`
      });
    });

    it("with a return value", () => {
      shouldFlipIfElse({
        code: `if (!isValid) return null;

doSomething();
doSomethingElse();`,
        expected: `if (isValid) {
  doSomething();
  doSomethingElse();
} else {
  return null;
}`
      });
    });

    it("with a return value in block", () => {
      shouldFlipIfElse({
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
      });
    });

    it("in a loop", () => {
      shouldFlipIfElse({
        code: `for (let index = 0; index < 5; index++) {
  if (index > 2) [cursor]console.log(index);
}`,
        expected: `for (let index = 0; index < 5; index++) {
  if (index <= 2) {
    continue;
  }
  console.log(index);
}`
      });
    });
  });

  it("should show an error message if refactoring can't be made", () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    const result = flipIfElse({
      state: "new",
      code: editor.code,
      selection: editor.selection,
      highlightSources: []
    });

    expect(result.action).toBe("show error");
  });
});

function shouldFlipIfElse({ code, expected }: { code: Code; expected: Code }) {
  const editor = new InMemoryEditor(code);
  const result = flipIfElse({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });

  expect(result).toMatchObject({ action: "write", code: expected });
}
