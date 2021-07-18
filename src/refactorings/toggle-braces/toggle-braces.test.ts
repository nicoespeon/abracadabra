import { ErrorReason, Code } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { toggleBraces } from "./toggle-braces";

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
    <section>
      <TestComponent testProp={"test"} />
    </section>
  );
}`
      },
      {
        description: "JSX attribute that's already a JSX expression",
        code: `<TestComponent testProp=[cursor]{"test"} />`,
        expected: `<TestComponent testProp={"test"} />`
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
      }
    ],
    async ({ code }) => {
      const editor = new InMemoryEditor(code);
      const originalCode = editor.code;

      await toggleBraces(editor);

      expect(editor.code).toBe(originalCode);
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
