import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code, ErrorReason } from "../../editor/editor";
import { testEach } from "../../tests-helpers";
import { convertToArrowFunction } from "./convert-to-arrow-function";

describe("Convert To Arrow Function", () => {
  testEach<{ code: Code; expected: Code }>(
    "should convert function declaration to arrow function",
    [
      {
        description: "non-generic",
        code: `function fn(a: string): number { return 1; }`,
        expected: `const fn = (a: string): number => { return 1; };`
      },
      {
        description: "non-generic async",
        code: `async function fn(a: string): number { return 1; }`,
        expected: `const fn = async (a: string): number => { return 1; };`
      },
      {
        description: "generic",
        code: `function fn<T>(t: T): T { return t; }`,
        expected: `const fn = <T>(t: T): T => { return t; };`
      },
      {
        description: "generic async",
        code: `async function fn<T>(t: T): T { return t; }`,
        expected: `const fn = async <T>(t: T): T => { return t; };`
      },
      {
        description: "preserves leading comment",
        code: `// This is a comment.

[cursor]function test() {}`,
        expected: `// This is a comment.

const test = () => {};`
      },
      {
        description: "preserves inner comment",
        code: `function test() {
  // This is a comment.
}`,
        expected: `const test = () => {
  // This is a comment.
};`
      },
      {
        description: "preserves trailing comment",
        code: `function test() {} // This is a comment.`,
        expected: `const test = () => {}; // This is a comment.`
      },
      {
        description: "with an interpreter directive",
        code: `#!/usr/bin/env node

[cursor]function test() {}`,
        expected: `#!/usr/bin/env node

const test = () => {};`
      },
      {
        description: "nested, cursor on outer function",
        code: `function outer[cursor]() {
  function inner() {
    return null
  }
}`,
        expected: `const outer = () => {
  function inner() {
    return null
  }
};`
      },
      {
        description: "nested, cursor on inner function",
        code: `function outer() {
  function [cursor]inner() {
    return null
  }
}`,
        expected: `function outer() {
  const inner = () => {
    return null
  };
}`
      },
      {
        description: "with reference after declaration",
        code: `function [cursor]doSomething() {}

doSomething();`,
        expected: `const doSomething = () => {};

doSomething();`
      },
      {
        description: "with imported type referenced in another function",
        code: `import { Input } from "./types";

function checkAnswer(input: Input) {}

function [cursor]doNothing() {}`,
        expected: `import { Input } from "./types";

function checkAnswer(input: Input) {}

const doNothing = () => {};`
      },
      {
        description: "an exported function expression",
        code: `export function [cursor]sayHello(name: string) {
  console.log(\`Well, hello here \${name} 👋\`);
}`,
        expected: `export const sayHello = (name: string) => {
  console.log(\`Well, hello here \${name} 👋\`);
};`
      },
      {
        description:
          "a function expression that's an argument to a call expression",
        code: `doThis(function[cursor] () {});`,
        expected: `doThis(() => {});`
      },
      {
        description: "function declarations above, but no reference",
        code: `function say(message) {
  logger.log(">", message);
}

function sayGoodMorning() {
  say("Good Morning");
}

function [cursor]sum(x) {
  return x + 1;
}`,
        expected: `function say(message) {
  logger.log(">", message);
}

function sayGoodMorning() {
  say("Good Morning");
}

const sum = x => {
  return x + 1;
};`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await convertToArrowFunction(editor);

      expect(editor.code).toBe(expected);
    }
  );

  it("should show an error message if there's a reference before declaration", async () => {
    const code = `doSomething();

function [cursor]doSomething() {}`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await convertToArrowFunction(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.CantConvertFunctionDeclarationBecauseUsedBefore
    );
  });

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await convertToArrowFunction(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindFunctionDeclarationToConvert
    );
  });

  it("should not refactor if cursor is inside function body", async () => {
    const code = `function dontConvertMe() {
  // Some code[cursor]
}`;
    const editor = new InMemoryEditor(code);

    await convertToArrowFunction(editor);

    expect(editor.code).toBe(`function dontConvertMe() {
  // Some code
}`);
  });
});
