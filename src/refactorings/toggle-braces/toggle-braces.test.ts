import { ErrorReason, Code } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { createVisitor, toggleBraces } from "./toggle-braces";

describe("Toggle Braces", () => {
  testEach<{ code: Code; expected: Code }>(
    "should add braces to",
    [
      {
        description: "if statement",
        code: "if (!isValid) ret[cursor]urn;",
        expected: `if (!isValid) {
  return;
}`
      },
      {
        description: "if statement, cursor on if",
        code: "[cursor]if (!isValid) return;",
        expected: `if (!isValid) {
  return;
}`
      },
      {
        description: "if-else scenario, selecting if",
        code: `if (isValid)
  d[cursor]oSomething();
else
  doAnotherThing();`,
        expected: `if (isValid) {
  doSomething();
} else
  doAnotherThing();`
      },
      {
        description: "if-else scenario, selecting else",
        code: `if (isValid)
  doSomething();
else
  d[cursor]oAnotherThing();`,
        expected: `if (isValid)
  doSomething();
else {
  doAnotherThing();
}`
      },
      {
        description: "if-else scenario, cursor on else",
        code: `if (isValid)
  doSomething();
[cursor]else
  doAnotherThing();`,
        expected: `if (isValid)
  doSomething();
else {
  doAnotherThing();
}`
      },
      {
        description: "many if statements, 2nd one selected",
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
      },
      {
        description: "nested if statements, cursor on nested",
        code: `if (isProd)
  if (isValid)
    [cursor]doSomething();`,
        expected: `if (isProd)
  if (isValid) {
    doSomething();
  }`
      },
      {
        description: "multiple statements after if",
        code: `if (isValid)
  [cursor]doSomething();
  doAnotherThing();`,
        expected: `if (isValid) {
  doSomething();
}
  doAnotherThing();`
      },
      {
        description: "JSX attribute",
        code: `<TestComponent testProp=[cursor]"test" />`,
        expected: `<TestComponent testProp={"test"} />`
      },
      {
        description: "cursor on the JSX identifier",
        code: `<TestComponent te[cursor]stProp="test" />`,
        expected: `<TestComponent testProp={"test"} />`
      },
      {
        description: "with multiple jsx attributes selecting the first one",
        code: `<TestComponent firstProp="firs[cursor]t" secondProp="second" />`,
        expected: `<TestComponent firstProp={"first"} secondProp="second" />`
      },
      {
        description: "with multiple jsx attributes selecting the second one",
        code: `<TestComponent firstProp="first" secondProp="s[cursor]econd" />`,
        expected: `<TestComponent firstProp="first" secondProp={"second"} />`
      },
      {
        description: "JSX attribute in a function component",
        code: `function TestComponent() {
  return (
    <section>
      <TestComponent testProp="t[cursor]est" />
    </section>
  );
}`,
        expected: `function TestComponent() {
  return (
    (<section>
      <TestComponent testProp={"test"} />
    </section>)
  );
}`
      },
      {
        description: "arrow function",
        code: `const sayHello = [cursor]() => "Hello!";`,
        expected: `const sayHello = () => {
  return "Hello!";
};`
      },
      {
        description: "nested arrow function, cursor on wrapper",
        code: `const createSayHello = [cursor]() => () => "Hello!";`,
        expected: `const createSayHello = () => {
  return () => "Hello!";
};`
      },
      {
        description: "nested arrow function, cursor on nested",
        code: `const createSayHello = () => [cursor]() => "Hello!";`,
        expected: `const createSayHello = () => () => {
  return "Hello!";
};`
      },
      {
        description:
          "JSX attribute nested in an if-statement, nested in an arrow function",
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
      },
      {
        description: "for statement",
        code: "for (let i = 0; i < 5; i++) cons[cursor]ole.log(i);",
        expected: `for (let i = 0; i < 5; i++) {
  console.log(i);
}`
      },
      {
        description: "for statement, cursor on for",
        code: "[cursor]for (let i = 0; i < 5; i++) console.log(i);",
        expected: `for (let i = 0; i < 5; i++) {
  console.log(i);
}`
      },
      {
        description: "nested for statement, cursor on nested",
        code: `for (let i = 0; i < 3; i++) {
  for (let j = 0; j < 4; j++) {[cursor]
    console.log(i * j);
  }
}`,
        expected: `for (let i = 0; i < 3; i++) {
  for (let j = 0; j < 4; j++)
    console.log(i * j);
}`
      },
      {
        description: "while statement",
        code: `while (true) cons[cursor]ole.log("Hello");`,
        expected: `while (true) {
  console.log("Hello");
}`
      },
      {
        description: "while statement, cursor on while",
        code: `[cursor]while (true) console.log("Hello");`,
        expected: `while (true) {
  console.log("Hello");
}`
      },
      {
        description: "do while statement",
        code: `do cons[cursor]ole.log("Hello"); while (true);`,
        expected: `do {
  console.log("Hello");
} while (true);`
      },
      {
        description: "do while statement, cursor on do",
        code: `[cursor]do console.log("Hello"); while (true);`,
        expected: `do {
  console.log("Hello");
} while (true);`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await toggleBraces(editor);

      expect(editor.code).toBe(expected);
    }
  );

  testEach<{ code: Code; expected: Code }>(
    "remove braces from",
    [
      {
        description: "an if statement",
        code: `if (!isValid) {[cursor]
  return;
}`,
        expected: `if (!isValid)
  return;`
      },
      {
        description: "an if statement, cursor on if",
        code: `[cursor]if (!isValid) {
  return;
}`,
        expected: `if (!isValid)
  return;`
      },
      {
        description: "if-else scenario, selecting if",
        code: `if (isValid) {
  d[cursor]oSomething();
} else
  doAnotherThing();`,
        expected: `if (isValid)
  doSomething();
else
  doAnotherThing();`
      },
      {
        description: "if-else scenario, selecting else",
        code: `if (isValid)
  doSomething();
else {
  d[cursor]oAnotherThing();
}`,
        expected: `if (isValid)
  doSomething();
else
  doAnotherThing();`
      },
      {
        description: "if-else scenario, cursor on else",
        code: `if (isValid)
  doSomething();
[cursor]else {
  doAnotherThing();
}`,
        expected: `if (isValid)
  doSomething();
else
  doAnotherThing();`
      },
      {
        description: "many if statements, 2nd one selected",
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
      },
      {
        description: "nested if statements, cursor on nested",
        code: `if (isProd)
i[cursor]f (isValid) {
  doSomething();
}`,
        expected: `if (isProd)
if (isValid)
  doSomething();`
      },
      {
        description: "multiple statements after if",
        code: `if (isValid) {
  [cursor]doSomething();
}
doAnotherThing();`,
        expected: `if (isValid)
  doSomething();
doAnotherThing();`
      },
      {
        description: "nested if statements, only wrapper can be refactored",
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
      },
      {
        description: "an arrow function",
        code: `const sayHello = () => {
  [cursor]return "Hello!";
};`,
        expected: `const sayHello = () => "Hello!";`
      },
      {
        description: "nested arrow function, cursor on wrapper",
        code: `const createSayHello = () => {
  [cursor]return () => {
    return "Hello!";
  }
};`,
        expected: `const createSayHello = () => () => {
  return "Hello!";
};`
      },
      {
        description: "nested arrow function, cursor on nested",
        code: `const createSayHello = () => {
  return () => {
    [cursor]return "Hello!";
  }
};`,
        expected: `const createSayHello = () => {
  return () => "Hello!";
};`
      },
      {
        description: "a JSX attribute",
        code: `<TestComponent testProp=[cursor]{"test"} />`,
        expected: `<TestComponent testProp="test" />`
      },
      {
        description: "a JSX attribute with single quote",
        code: `<TestComponent testProp=[cursor]{'test'} />`,
        expected: `<TestComponent testProp="test" />`
      },
      {
        description: "multiple JSX attributes, cursor on first attribute",
        code: `<TestComponent firstProp={'[cursor]test'} secondProp={'test'} />`,
        expected: `<TestComponent firstProp="test" secondProp={'test'} />`
      },
      {
        description: "multiple JSX attributes, cursor on second attribute",
        code: `<TestComponent firstProp={'test'} secondProp={'t[cursor]est'} />`,
        expected: `<TestComponent firstProp={'test'} secondProp="test" />`
      },
      {
        description: "a JSX attribute in a function component",
        code: `function TestComponent() {
  return (
    <section>
      <TestComponent testProp={'[cursor]test'} />
    </section>
  );
}`,
        expected: `function TestComponent() {
  return (
    (<section>
      <TestComponent testProp="test" />
    </section>)
  );
}`
      },
      {
        description: "a for statement",
        code: `for (let i = 0; i < 5; i++) { cons[cursor]ole.log(i); }`,
        expected: `for (let i = 0; i < 5; i++)
  console.log(i);`
      },
      {
        description: "a for statement, cursor on for",
        code: `[cursor]for (let i = 0; i < 5; i++) { console.log(i); }`,
        expected: `for (let i = 0; i < 5; i++)
  console.log(i);`
      },
      {
        description: "a while statement",
        code: `while (true) { cons[cursor]ole.log("Hello"); }`,
        expected: `while (true)
  console.log("Hello");`
      },
      {
        description: "a while statement, cursor on while",
        code: `[cursor]while (true) { console.log("Hello"); }`,
        expected: `while (true)
  console.log("Hello");`
      },
      {
        description: "a do while statement",
        code: `do { cons[cursor]ole.log("Hello"); } while (true);`,
        expected: `do
  console.log("Hello");
while (true);`
      },
      {
        description: "a do while statement, cursor on do",
        code: `[cursor]do { console.log("Hello"); } while (true);`,
        expected: `do
  console.log("Hello");
while (true);`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await toggleBraces(editor);

      expect(editor.code).toBe(expected);
    }
  );

  testEach<{ code: Code }>(
    "should not apply to",
    [
      {
        description: "block with multiple statements, selection on if",
        code: `if (!isValid) {[cursor]
  doSomething();
  return;
}`
      },
      {
        description: "block with multiple statements, selection on else",
        code: `if (!isValid) {
  doSomething();
} el[cursor]se {
  doSomethingElse();
  return;
}`
      },
      {
        description: "an arrow function that returns nothing",
        code: `const sayHello = () => {
  [cursor]return;
}`
      },
      {
        description: "an arrow function that has no return",
        code: `const sayHello = () => {
  [cursor]console.log("Hello!");
}`
      },
      {
        description: "an arrow function with multiple statements",
        code: `const sayHello = () => {
  [cursor]const hello = "Hello!";
  return hello;
}`
      },
      {
        description:
          "an arrow function with statements after return (dead code)",
        code: `const sayHello = () => {
  [cursor]return "Hello!";
  console.log("Some dead code");
}`
      },
      {
        description: "JSX expression that is a function",
        code: `<TestComponent testProp=[cursor]{function() { /* should not be replaced */ }} />`
      },
      {
        description: "JSX epxression that is an arrow function",
        code: `<TestComponent testProp=[cursor]{() => { /* should not be replaced */ }} />`
      },
      {
        description: "JSX expression that is an object",
        code: `<TestComponent testProp=[cursor]{{ should: 'not', be: 'replaced' }} />`
      },
      {
        description:
          "string expression not in JSX attribute should not be replaced",
        code: `function TestComponent() {
  return (
    [cursor]<section>
      {'test'}
      <TestComponent />
    </section>
  );
}`
      },
      {
        description: "an empty for statement",
        code: `for (let i = 0; i < 5; i++) { }`
      },
      {
        description: "a for statement with multiple statements",
        code: `for (let i = 0; i < 5; i++) { console.log("Hello"); console.log("World"); }`
      },
      {
        description: "an empty while statement",
        code: `while (true) { }`
      },
      {
        description: "a while statement with multiple statements",
        code: `while (true) { console.log("Hello"); console.log("World"); }`
      },
      {
        description: "an empty do while statement",
        code: `do { } while (true);`
      },
      {
        description: "a do while statement with multiple statements",
        code: `do { console.log("Hello"); console.log("World"); } while (true);`
      }
    ],
    async ({ code }) => {
      const editor = new InMemoryEditor(code);
      const originalCode = editor.code;

      await toggleBraces(editor);

      expect(editor.code).toBe(originalCode);
      await expect(createVisitor).not.toMatchEditor(editor);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await toggleBraces(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindStatementToToggleBraces
    );
  });
});
