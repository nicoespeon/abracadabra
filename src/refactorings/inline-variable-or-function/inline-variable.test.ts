import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { inlineVariable } from "./inline-variable";

describe("Inline Variable", () => {
  let showErrorMessage: Editor["showError"];

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ selection: Selection }>(
    "should select variable value if",
    [
      {
        description: "all variable declaration is selected",
        selection: new Selection([0, 0], [0, 18])
      },
      {
        description: "cursor is on value",
        selection: Selection.cursorAt(0, 14)
      },
      {
        description: "cursor is on identifier",
        selection: Selection.cursorAt(0, 7)
      },
      {
        description: "cursor is on declarator",
        selection: Selection.cursorAt(0, 2)
      }
    ],
    async ({ selection }) => {
      const code = `const foo = "bar";
console.log(foo);`;

      const result = await doInlineVariable(code, selection);

      expect(result).toBe(`console.log("bar");`);
    }
  );

  testEach<{ code: Code; selection: Selection; expected: Code }>(
    "should inline the variable value",
    [
      {
        description: "basic scenario",
        code: `const foo = "bar";
const hello = "World!";
console.log(foo);`,
        selection: new Selection([0, 0], [0, 18]),
        expected: `const hello = "World!";
console.log("bar");`
      },
      {
        description: "many references",
        code: `const hello = "Hello!";
console.log(hello);
sendMessageSaying(hello).to(world);`,
        selection: new Selection([0, 0], [0, 18]),
        expected: `console.log("Hello!");
sendMessageSaying("Hello!").to(world);`
      },
      {
        description: "property key with the same name",
        code: `const hello = "Hello!";
console.log({
  hello: hello
});`,
        selection: Selection.cursorAt(0, 14),
        expected: `console.log({
  hello: "Hello!"
});`
      },
      {
        description: "property key, shorthand version",
        code: `const hello = "Hello!";
console.log({
  hello
});`,
        selection: Selection.cursorAt(0, 14),
        expected: `console.log({
  hello: "Hello!"
});`
      },
      {
        description: "member expression with the same name",
        code: `const world = props.world;
const helloWorld = sayHelloTo(world);
console.log(around.the.world);`,
        selection: Selection.cursorAt(0, 9),
        expected: `const helloWorld = sayHelloTo(props.world);
console.log(around.the.world);`
      },
      {
        description: "variable declarator on a different line",
        code: `const world =
  "Hello!";
const helloWorld = sayHelloTo(world);`,
        selection: Selection.cursorAt(1, 2),
        expected: `const helloWorld = sayHelloTo("Hello!");`
      },
      {
        description: "unary expression",
        code: `const isCorrect = "Hello!";
return !isCorrect;`,
        selection: Selection.cursorAt(0, 6),
        expected: `return !("Hello!");`
      },
      {
        description: "object",
        code: `const foo = { value: "foo" };
console.log(foo.value);`,
        selection: Selection.cursorAt(0, 6),
        expected: `console.log({ value: "foo" }.value);`
      },
      {
        description: "limited scope",
        code: `function sayHello() {
  const hello = "Hello!";
  console.log(hello);
}

console.log(hello);`,
        selection: Selection.cursorAt(1, 14),
        expected: `function sayHello() {
  console.log("Hello!");
}

console.log(hello);`
      },
      {
        description: "shadowed variable",
        code: `const hello = "Hello!";
console.log(hello);

if (isHappy) {
  const hello = "Hello!!";
  console.log(hello);
}

{
  const hello = "World";
  console.log(hello);
}

function sayHello(yo, hello) {
  console.log(hello);
}`,
        selection: Selection.cursorAt(0, 14),
        expected: `console.log("Hello!");

if (isHappy) {
  const hello = "Hello!!";
  console.log(hello);
}

{
  const hello = "World";
  console.log(hello);
}

function sayHello(yo, hello) {
  console.log(hello);
}`
      },
      {
        description: "export outside of declaration scope",
        code: `function sayHello() {
  const hello = "Hello!";
  console.log(hello);
}

const hello = "Some other thing";
export { hello };`,
        selection: Selection.cursorAt(1, 14),
        expected: `function sayHello() {
  console.log("Hello!");
}

const hello = "Some other thing";
export { hello };`
      },
      {
        description: "a destructured variable",
        code: `const { userId } = session;
messages.map(message => ({ userId }));`,
        selection: Selection.cursorAt(0, 9),
        expected: `messages.map(message => ({ userId: session.userId }));`
      }
    ],
    async ({ code, selection, expected }) => {
      const result = await doInlineVariable(code, selection);
      expect(result).toBe(expected);
    }
  );

  describe("multiple variables declaration", () => {
    const code = `const one = 1, two = 2, three = 3;
const result = one + two + three;`;

    it("should select the correct variable value (basic scenario)", async () => {
      const selection = Selection.cursorAt(0, 15);

      const result = await doInlineVariable(code, selection);

      expect(result).toBe(`const one = 1, three = 3;
const result = one + 2 + three;`);
    });

    it("should select the correct variable value (last variable)", async () => {
      const selection = Selection.cursorAt(0, 24);

      const result = await doInlineVariable(code, selection);

      expect(result).toBe(`const one = 1, two = 2;
const result = one + two + 3;`);
    });

    it("should select the correct variable value (first variable)", async () => {
      const selection = Selection.cursorAt(0, 6);

      const result = await doInlineVariable(code, selection);

      expect(result).toBe(`const two = 2, three = 3;
const result = 1 + two + three;`);
    });

    it("should not inline code if cursor is not explicitly on one of the variables", async () => {
      const selectionOnDeclarator = Selection.cursorAt(0, 0);

      await doInlineVariable(code, selectionOnDeclarator);

      expect(showErrorMessage).toBeCalledWith(
        ErrorReason.DidNotFoundInlinableCode
      );
    });

    it("should work on multi-lines declarations", async () => {
      const code = `const one = 1,
  two = 2,
  three = 3;
const result = one + two + three;`;
      const selection = Selection.cursorAt(1, 2);

      const result = await doInlineVariable(code, selection);

      expect(result).toBe(`const one = 1,
  three = 3;
const result = one + 2 + three;`);
    });

    it("should work on multi-lines declarations, with declaration on previous line", async () => {
      const code = `const one =
    1,
  two =
    2,
  three =
    3;
const result = one + two + three;`;
      const selection = Selection.cursorAt(2, 2);

      const result = await doInlineVariable(code, selection);

      expect(result).toBe(`const one =
    1,
  three =
    3;
const result = one + 2 + three;`);
    });
  });

  // ✋ Patterns that can't be inlined

  it("should show an error message if selection is not inlinable", async () => {
    const code = `console.log("Nothing to inline here!")`;
    const selection = Selection.cursorAt(0, 0);

    await doInlineVariable(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundInlinableCode
    );
  });

  it("should show an error message if variable is not used", async () => {
    const code = `const hello = "Hello!";`;
    const selection = Selection.cursorAt(0, 0);

    await doInlineVariable(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundInlinableCodeIdentifiers
    );
  });

  testEach<{ code: Code; selection: Selection }>(
    "should not inline an exported variable if",
    [
      {
        description: "export declaration",
        code: `export const foo = "bar", hello = "world";
console.log(foo);`,
        selection: Selection.cursorAt(0, 19)
      },
      {
        description: "export after declaration",
        code: `const foo = "bar", hello = "world";
console.log(foo);

export { hello, foo };`,
        selection: Selection.cursorAt(0, 12)
      },
      {
        description: "export before declaration",
        code: `export { foo };
const foo = "bar", hello = "world";
console.log(foo);`,
        selection: Selection.cursorAt(1, 12)
      },
      {
        description: "default export after declaration",
        code: `const foo = "bar", hello = "world";
console.log(foo);

export default foo;`,
        selection: Selection.cursorAt(0, 12)
      }
    ],
    async ({ code, selection }) => {
      await doInlineVariable(code, selection);

      expect(showErrorMessage).toBeCalledWith(
        ErrorReason.CantInlineExportedVariables
      );
    }
  );

  it("should not inline a redeclared variable", async () => {
    const code = `let hello = "Hello!";
console.log(hello);
hello = "World!";`;
    const selection = Selection.cursorAt(0, 5);

    await doInlineVariable(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.CantInlineRedeclaredVariables
    );
  });

  async function doInlineVariable(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const editor = new InMemoryEditor(code);
    editor.showError = showErrorMessage;
    await inlineVariable(code, selection, editor);
    return editor.code;
  }
});
