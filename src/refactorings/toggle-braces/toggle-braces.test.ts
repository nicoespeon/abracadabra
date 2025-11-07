import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code } from "../../editor/editor";
import { toggleBraces } from "./toggle-braces";

describe("Toggle Braces", () => {
  describe("should add braces to", () => {
    it("if statement", () => {
      shouldToggleBraces({
        code: "if (!isValid) ret[cursor]urn;",
        expected: `if (!isValid) {
  return;
}`
      });
    });

    it("if statement, cursor on if", () => {
      shouldToggleBraces({
        code: "[cursor]if (!isValid) return;",
        expected: `if (!isValid) {
  return;
}`
      });
    });

    it("if-else scenario, selecting if", () => {
      shouldToggleBraces({
        code: `if (isValid)
  d[cursor]oSomething();
else
  doAnotherThing();`,
        expected: `if (isValid) {
  doSomething();
} else
  doAnotherThing();`
      });
    });

    it("if-else scenario, selecting else", () => {
      shouldToggleBraces({
        code: `if (isValid)
  doSomething();
else
  d[cursor]oAnotherThing();`,
        expected: `if (isValid)
  doSomething();
else {
  doAnotherThing();
}`
      });
    });

    it("if-else scenario, cursor on else", () => {
      shouldToggleBraces({
        code: `if (isValid)
  doSomething();
[cursor]else
  doAnotherThing();`,
        expected: `if (isValid)
  doSomething();
else {
  doAnotherThing();
}`
      });
    });

    it("many if statements, 2nd one selected", () => {
      shouldToggleBraces({
        code: `if (isProd) logEvent();

if (isValid)
  [cursor]doSomething();
else
  doAnotherThing();`,
        expected: `if (isProd) logEvent();

if (isValid) {
  doSomething();
} else
  doAnotherThing();`
      });
    });

    it("nested if statements, cursor on nested", () => {
      shouldToggleBraces({
        code: `if (isProd)
  if (isValid)
    [cursor]doSomething();`,
        expected: `if (isProd)
  if (isValid) {
    doSomething();
  }`
      });
    });

    it("multiple statements after if", () => {
      shouldToggleBraces({
        code: `if (isValid)
  [cursor]doSomething();
  doAnotherThing();`,
        expected: `if (isValid) {
  doSomething();
}
  doAnotherThing();`
      });
    });

    it("JSX attribute", () => {
      shouldToggleBraces({
        code: `<TestComponent testProp=[cursor]"test" />`,
        expected: `<TestComponent testProp={"test"} />`
      });
    });

    it("cursor on the JSX identifier", () => {
      shouldToggleBraces({
        code: `<TestComponent te[cursor]stProp="test" />`,
        expected: `<TestComponent testProp={"test"} />`
      });
    });

    it("with multiple jsx attributes selecting the first one", () => {
      shouldToggleBraces({
        code: `<TestComponent firstProp="firs[cursor]t" secondProp="second" />`,
        expected: `<TestComponent firstProp={"first"} secondProp="second" />`
      });
    });

    it("with multiple jsx attributes selecting the second one", () => {
      shouldToggleBraces({
        code: `<TestComponent firstProp="first" secondProp="s[cursor]econd" />`,
        expected: `<TestComponent firstProp="first" secondProp={"second"} />`
      });
    });

    it("JSX attribute in a function component", () => {
      shouldToggleBraces({
        code: `function TestComponent() {
  return (
    <section>
      <TestComponent testProp="t[cursor]est" />
    </section>
  );
}`,
        expected: `function TestComponent() {
  return (
    <section>
      <TestComponent testProp={"test"} />
    </section>
  );
}`
      });
    });

    it("arrow function", () => {
      shouldToggleBraces({
        code: `const sayHello = [cursor]() => "Hello!";`,
        expected: `const sayHello = () => {
  return "Hello!";
};`
      });
    });

    it("nested arrow function, cursor on wrapper", () => {
      shouldToggleBraces({
        code: `const createSayHello = [cursor]() => () => "Hello!";`,
        expected: `const createSayHello = () => {
  return () => "Hello!";
};`
      });
    });

    it("nested arrow function, cursor on nested", () => {
      shouldToggleBraces({
        code: `const createSayHello = () => [cursor]() => "Hello!";`,
        expected: `const createSayHello = () => () => {
  return "Hello!";
};`
      });
    });

    it("JSX attribute nested in an if-statement, nested in an arrow function", () => {
      shouldToggleBraces({
        code: `const render = (isValid) => {
  if (isValid)
    return <SayHello name="[cursor]John" />;

  return <SayBye />;
}`,
        expected: `const render = (isValid) => {
  if (isValid)
    return <SayHello name={"John"} />;

  return <SayBye />;
}`
      });
    });

    it("for statement", () => {
      shouldToggleBraces({
        code: "for (let i = 0; i < 5; i++) cons[cursor]ole.log(i);",
        expected: `for (let i = 0; i < 5; i++) {
  console.log(i);
}`
      });
    });

    it("for statement, cursor on for", () => {
      shouldToggleBraces({
        code: "[cursor]for (let i = 0; i < 5; i++) console.log(i);",
        expected: `for (let i = 0; i < 5; i++) {
  console.log(i);
}`
      });
    });

    it("nested for statement, cursor on nested", () => {
      shouldToggleBraces({
        code: `for (let i = 0; i < 3; i++) {
  for (let j = 0; j < 4; j++) {[cursor]
    console.log(i * j);
  }
}`,
        expected: `for (let i = 0; i < 3; i++) {
  for (let j = 0; j < 4; j++)
    console.log(i * j);
}`
      });
    });

    it("while statement", () => {
      shouldToggleBraces({
        code: `while (true) cons[cursor]ole.log("Hello");`,
        expected: `while (true) {
  console.log("Hello");
}`
      });
    });

    it("while statement, cursor on while", () => {
      shouldToggleBraces({
        code: `[cursor]while (true) console.log("Hello");`,
        expected: `while (true) {
  console.log("Hello");
}`
      });
    });

    it("do while statement", () => {
      shouldToggleBraces({
        code: `do cons[cursor]ole.log("Hello"); while (true);`,
        expected: `do {
  console.log("Hello");
} while (true);`
      });
    });

    it("do while statement, cursor on do", () => {
      shouldToggleBraces({
        code: `[cursor]do console.log("Hello"); while (true);`,
        expected: `do {
  console.log("Hello");
} while (true);`
      });
    });
  });

  describe("remove braces from", () => {
    it("an if statement", () => {
      shouldToggleBraces({
        code: `if (!isValid) {[cursor]
  return;
}`,
        expected: `if (!isValid)
  return;`
      });
    });

    it("an if statement, cursor on if", () => {
      shouldToggleBraces({
        code: `[cursor]if (!isValid) {
  return;
}`,
        expected: `if (!isValid)
  return;`
      });
    });

    it("if-else scenario, selecting if", () => {
      shouldToggleBraces({
        code: `if (isValid) {
  d[cursor]oSomething();
} else
  doAnotherThing();`,
        expected: `if (isValid)
  doSomething();
else
  doAnotherThing();`
      });
    });

    it("if-else scenario, selecting else", () => {
      shouldToggleBraces({
        code: `if (isValid)
  doSomething();
else {
  d[cursor]oAnotherThing();
}`,
        expected: `if (isValid)
  doSomething();
else
  doAnotherThing();`
      });
    });

    it("if-else scenario, cursor on else", () => {
      shouldToggleBraces({
        code: `if (isValid)
  doSomething();
[cursor]else {
  doAnotherThing();
}`,
        expected: `if (isValid)
  doSomething();
else
  doAnotherThing();`
      });
    });

    it("many if statements, 2nd one selected", () => {
      shouldToggleBraces({
        code: `if (isProd) logEvent();

if (isValid) {
  [cursor]doSomething();
} else
  doAnotherThing();`,
        expected: `if (isProd) logEvent();

if (isValid)
  doSomething();
else
  doAnotherThing();`
      });
    });

    it("nested if statements, cursor on nested", () => {
      shouldToggleBraces({
        code: `if (isProd)
i[cursor]f (isValid) {
  doSomething();
}`,
        expected: `if (isProd)
if (isValid)
  doSomething();`
      });
    });

    it("multiple statements after if", () => {
      shouldToggleBraces({
        code: `if (isValid) {
  [cursor]doSomething();
}
doAnotherThing();`,
        expected: `if (isValid)
  doSomething();
doAnotherThing();`
      });
    });

    it("nested if statements, only wrapper can be refactored", () => {
      shouldToggleBraces({
        code: `if (isValid) {
  if (isMorning) {
    [cursor]doSomething();
    return doSomethingElse();
  }
}`,
        expected: `if (isValid) if (isMorning) {
  doSomething();
  return doSomethingElse();
}`
      });
    });

    it("an arrow function", () => {
      shouldToggleBraces({
        code: `const sayHello = () => {
  [cursor]return "Hello!";
};`,
        expected: `const sayHello = () => "Hello!";`
      });
    });

    it("nested arrow function, cursor on wrapper", () => {
      shouldToggleBraces({
        code: `const createSayHello = () => {
  [cursor]return () => {
    return "Hello!";
  }
};`,
        expected: `const createSayHello = () => () => {
  return "Hello!";
};`
      });
    });

    it("nested arrow function, cursor on nested", () => {
      shouldToggleBraces({
        code: `const createSayHello = () => {
  return () => {
    [cursor]return "Hello!";
  }
};`,
        expected: `const createSayHello = () => {
  return () => "Hello!";
};`
      });
    });

    it("a JSX attribute", () => {
      shouldToggleBraces({
        code: `<TestComponent testProp=[cursor]{"test"} />`,
        expected: `<TestComponent testProp="test" />`
      });
    });

    it("a JSX attribute with single quote", () => {
      shouldToggleBraces({
        code: `<TestComponent testProp=[cursor]{'test'} />`,
        expected: `<TestComponent testProp="test" />`
      });
    });

    it("multiple JSX attributes, cursor on first attribute", () => {
      shouldToggleBraces({
        code: `<TestComponent firstProp={'[cursor]test'} secondProp={'test'} />`,
        expected: `<TestComponent firstProp="test" secondProp={'test'} />`
      });
    });

    it("multiple JSX attributes, cursor on second attribute", () => {
      shouldToggleBraces({
        code: `<TestComponent firstProp={'test'} secondProp={'t[cursor]est'} />`,
        expected: `<TestComponent firstProp={'test'} secondProp="test" />`
      });
    });

    it("a JSX attribute in a function component", () => {
      shouldToggleBraces({
        code: `function TestComponent() {
  return (
    <section>
      <TestComponent testProp={'[cursor]test'} />
    </section>
  );
}`,
        expected: `function TestComponent() {
  return (
    <section>
      <TestComponent testProp="test" />
    </section>
  );
}`
      });
    });

    it("a for statement", () => {
      shouldToggleBraces({
        code: `for (let i = 0; i < 5; i++) { cons[cursor]ole.log(i); }`,
        expected: `for (let i = 0; i < 5; i++)
  console.log(i);`
      });
    });

    it("a for statement, cursor on for", () => {
      shouldToggleBraces({
        code: `[cursor]for (let i = 0; i < 5; i++) { console.log(i); }`,
        expected: `for (let i = 0; i < 5; i++)
  console.log(i);`
      });
    });

    it("a while statement", () => {
      shouldToggleBraces({
        code: `while (true) { cons[cursor]ole.log("Hello"); }`,
        expected: `while (true)
  console.log("Hello");`
      });
    });

    it("a while statement, cursor on while", () => {
      shouldToggleBraces({
        code: `[cursor]while (true) { console.log("Hello"); }`,
        expected: `while (true)
  console.log("Hello");`
      });
    });

    it("a do while statement", () => {
      shouldToggleBraces({
        code: `do { cons[cursor]ole.log("Hello"); } while (true);`,
        expected: `do
  console.log("Hello");
while (true);`
      });
    });

    it("a do while statement, cursor on do", () => {
      shouldToggleBraces({
        code: `[cursor]do { console.log("Hello"); } while (true);`,
        expected: `do
  console.log("Hello");
while (true);`
      });
    });
  });

  describe("should not apply to", () => {
    it("block with multiple statements, selection on if", () => {
      shouldNotToggleBraces(
        `if (!isValid) {[cursor]
  doSomething();
  return;
}`
      );
    });

    it("block with multiple statements, selection on else", () => {
      shouldNotToggleBraces(
        `if (!isValid) {
  doSomething();
} el[cursor]se {
  doSomethingElse();
  return;
}`
      );
    });

    it("an arrow function that returns nothing", () => {
      shouldNotToggleBraces(
        `const sayHello = () => {
  [cursor]return;
}`
      );
    });

    it("an arrow function that has no return", () => {
      shouldNotToggleBraces(
        `const sayHello = () => {
  [cursor]console.log("Hello!");
}`
      );
    });

    it("an arrow function with multiple statements", () => {
      shouldNotToggleBraces(
        `const sayHello = () => {
  [cursor]const hello = "Hello!";
  return hello;
}`
      );
    });

    it("an arrow function with statements after return (dead code)", () => {
      shouldNotToggleBraces(
        `const sayHello = () => {
  [cursor]return "Hello!";
  console.log("Some dead code");
}`
      );
    });

    it("JSX expression that is a function", () => {
      shouldNotToggleBraces(
        `<TestComponent testProp=[cursor]{function() { /* should not be replaced */ }} />`
      );
    });

    it("JSX epxression that is an arrow function", () => {
      shouldNotToggleBraces(
        `<TestComponent testProp=[cursor]{() => { /* should not be replaced */ }} />`
      );
    });

    it("JSX expression that is an object", () => {
      shouldNotToggleBraces(
        `<TestComponent testProp=[cursor]{{ should: 'not', be: 'replaced' }} />`
      );
    });

    it("string expression not in JSX attribute should not be replaced", () => {
      shouldNotToggleBraces(
        `function TestComponent() {
  return (
    [cursor]<section>
      {'test'}
      <TestComponent />
    </section>
  );
}`
      );
    });

    it("an empty for statement", () => {
      shouldNotToggleBraces(`for (let i = 0; i < 5; i++) { }`);
    });

    it("a for statement with multiple statements", () => {
      shouldNotToggleBraces(
        `for (let i = 0; i < 5; i++) { console.log("Hello"); console.log("World"); }`
      );
    });

    it("an empty while statement", () => {
      shouldNotToggleBraces(`while (true) { }`);
    });

    it("a while statement with multiple statements", () => {
      shouldNotToggleBraces(
        `while (true) { console.log("Hello"); console.log("World"); }`
      );
    });

    it("an empty do while statement", () => {
      shouldNotToggleBraces(`do { } while (true);`);
    });

    it("a do while statement with multiple statements", () => {
      shouldNotToggleBraces(
        `do { console.log("Hello"); console.log("World"); } while (true);`
      );
    });
  });

  it("should show an error message if refactoring can't be made", () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    const result = toggleBraces({
      state: "new",
      code: editor.code,
      selection: editor.selection,
      highlightSources: []
    });

    expect(result.action).toBe("show error");
  });
});

function shouldToggleBraces({
  code,
  expected
}: {
  code: Code;
  expected: Code;
}) {
  const editor = new InMemoryEditor(code);
  const result = toggleBraces({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });

  expect(result).toMatchObject({ action: "write", code: expected });
}

function shouldNotToggleBraces(code: Code) {
  const editor = new InMemoryEditor(code);
  const result = toggleBraces({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });

  expect(result.action).toBe("show error");
}
