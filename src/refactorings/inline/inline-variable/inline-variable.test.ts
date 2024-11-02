import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { Code, ErrorReason } from "../../../editor/editor";
import { testEach } from "../../../tests-helpers";
import { inlineVariable } from "./inline-variable";

describe("Inline Variable", () => {
  testEach<{ code: Code; expected: Code }>(
    "should select variable value if",
    [
      {
        description: "all variable declaration is selected",
        code: `[start]const foo = "bar";[end]
console.log(foo);`,
        expected: `console.log("bar");`
      },
      {
        description: "cursor is on value",
        code: `const foo = [cursor]"bar";
console.log(foo);`,
        expected: `console.log("bar");`
      },
      {
        description: "cursor is on identifier",
        code: `const f[cursor]oo = "bar";
console.log(foo);`,
        expected: `console.log("bar");`
      },
      {
        description: "cursor is on declarator",
        code: `co[cursor]nst foo = "bar";
console.log(foo);`,
        expected: `console.log("bar");`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await inlineVariable(editor);

      expect(editor.code).toBe(expected);
    }
  );

  testEach<{ code: Code; expected: Code }>(
    "should inline the variable value",
    [
      {
        description: "basic scenario",
        code: `[start]const foo = "bar";[end]
const hello = "World!";
console.log(foo);`,
        expected: `const hello = "World!";
console.log("bar");`
      },
      {
        description: "many references",
        code: `[start]const hello = "Hel[end]lo!";
console.log(hello);
sendMessageSaying(hello).to(world);`,
        expected: `console.log("Hello!");
sendMessageSaying("Hello!").to(world);`
      },
      {
        description: "property key with the same name",
        code: `const hello = [cursor]"Hello!";
console.log({
  hello: hello
});`,
        expected: `console.log({
  hello: "Hello!"
});`
      },
      {
        description: "property key, shorthand version",
        code: `const hello = [cursor]"Hello!";
console.log({
  hello
});`,
        expected: `console.log({
  hello: "Hello!"
});`
      },
      {
        description: "member expression with the same name",
        code: `const wor[cursor]ld = props.world;
const helloWorld = sayHelloTo(world);
console.log(around.the.world);`,
        expected: `const helloWorld = sayHelloTo(props.world);
console.log(around.the.world);`
      },
      {
        description: "variable declarator on a different line",
        code: `const world =
  [cursor]"Hello!";
const helloWorld = sayHelloTo(world);`,
        expected: `const helloWorld = sayHelloTo("Hello!");`
      },
      {
        description: "unary expression",
        code: `const [cursor]isCorrect = "Hello!";
return !isCorrect;`,
        expected: `return !("Hello!");`
      },
      {
        description: "object",
        code: `const [cursor]foo = { value: "foo" };
console.log(foo.value);`,
        expected: `console.log({ value: "foo" }.value);`
      },
      {
        description: "limited scope",
        code: `function sayHello() {
  const hello [cursor]= "Hello!";
  console.log(hello);
}

console.log(hello);`,
        expected: `function sayHello() {
  console.log("Hello!");
}

console.log(hello);`
      },
      {
        description: "shadowed variable",
        code: `const hello = [cursor]"Hello!";
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
        description: "shadowed variable in a lambda",
        code: `const title[cursor] = document.title;
const lambda = (title: string) => title.length > 0;

return {title: title};`,
        expected: `const lambda = (title: string) => title.length > 0;

return {title: document.title};`
      },
      {
        description: "shadowed variable in a method",
        code: `const hello[cursor] = "Hello!";
console.log(hello);

fn({ set(hello) {} });`,
        expected: `console.log("Hello!");

fn({ set(hello) {} });`
      },
      {
        description: "export outside of declaration scope",
        code: `function sayHello() {
  const hello = [cursor]"Hello!";
  console.log(hello);
}

const hello = "Some other thing";
export { hello };`,
        expected: `function sayHello() {
  console.log("Hello!");
}

const hello = "Some other thing";
export { hello };`
      },
      {
        description: "type alias",
        code: `type Value = "one" | "many" | "none";
interface Something {
  value: Value;
}`,
        expected: `interface Something {
  value: "one" | "many" | "none";
}`
      },
      {
        description: "type alias, many references",
        code: `type Value = "one" | "many" | "none";
interface Something {
  value: Value;
  otherValue: Value;
}`,
        expected: `interface Something {
  value: "one" | "many" | "none";
  otherValue: "one" | "many" | "none";
}`
      },
      {
        description: "selected type alias only",
        code: `type Value = "one" | "many" | "none";
type Key = string;
interface Something {
  value: Value;
  key: Key;
}`,
        expected: `type Key = string;
interface Something {
  value: "one" | "many" | "none";
  key: Key;
}`
      },
      {
        description: "variable is computed",
        code: `const foo[cursor] = "bar";
console.log({ [foo]: "Hello" });`,
        expected: `console.log({ ["bar"]: "Hello" });`
      },
      {
        description: "variable is type-casted",
        code: `const saveButton[cursor] = document.getElementById('btnSave') as HTMLButtonElement;
saveButton.disabled = true;
if (saveButton) {
  this.doSomethingElse(saveButton);
}`,
        expected: `(document.getElementById('btnSave') as HTMLButtonElement).disabled = true;
if (document.getElementById('btnSave') as HTMLButtonElement) {
  this.doSomethingElse(document.getElementById('btnSave') as HTMLButtonElement);
}`
      },
      {
        description: "a JSX element into another",
        code: `const header[cursor] = <h1>Hello</h1>;
const page = <div>{header}</div>;`,
        expected: `const page = <div><h1>Hello</h1></div>;`
      },
      {
        description: "a JSX element into a JSX attribute",
        code: `function MyComponent() {
  const header[cursor] = <span>hello</span>;
  return <Menu header={header} />
}`,
        expected: `function MyComponent() {
  return <Menu header={<span>hello</span>} />
}`
      },
      {
        description: "a multi-lines JSX element into another",
        code: `const header[cursor] = (
  <h1>Hello</h1>
);
const page = <div>{header}</div>;`,
        expected: `const page = <div><h1>Hello</h1></div>;`
      },
      {
        description: "a string literal inside a template literal",
        code: `const name[cursor] = "world!";
console.log(\`Hello \${name}\`);`,
        expected: `console.log(\`Hello world!\`);`
      },
      {
        description: "a number literal inside a template literal",
        code: `const age[cursor] = 23;
console.log(\`I am \${age}\`);`,
        expected: `console.log(\`I am 23\`);`
      },
      {
        description: "an expression inside a template literal",
        code: `const authToken = AuthStore.get("authToken");
log(\`Bearer \${authToken}\`)`,
        expected: `log(\`Bearer \${AuthStore.get("authToken")}\`)`
      },
      {
        description: "a multi-lines string inside a template literal",
        code: `const name[cursor] = \`world!

How are you doing?\`;
console.log(\`Hello \${name}\`);`,
        expected: `console.log(\`Hello world!

How are you doing?\`);`
      },
      {
        description: "with the satisfies operator",
        code: `[start]const foo = "bar";[end]
const hello = "World!";
console.log(foo satisfies string);`,
        expected: `const hello = "World!";
console.log("bar" satisfies string);`
      },
      {
        description: "a variable declaration that is an async arrow expression",
        code: `const foo[cursor] = async (a: number) => {
  console.log(a);
};
const bar = async () => {
  await foo(3);
};`,
        expected: `const bar = async () => {
  await (async (a: number) => {
  console.log(a);
})(3);
};`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await inlineVariable(editor);

      expect(editor.code).toBe(expected);
    }
  );

  describe("preserve parenthesis around inlined expression", () => {
    it("should do this for binary expressions", async () => {
      const code = `const someValue[cursor] = a + b
const result = someValue * 100`;
      const editor = new InMemoryEditor(code);

      await inlineVariable(editor);

      expect(editor.code).toBe(`const result = (a + b) * 100`);
    });
  });

  testEach<{ code: Code; expected: Code }>(
    "should preserve parenthesis around inlined variable",
    [
      {
        description: "binary expression",
        code: `const someValue[cursor] = a + b
const result = someValue * 100`,
        expected: `const result = (a + b) * 100`
      },
      {
        description: "binary expression in function call",
        code: `const style[cursor] = commit.head === true ? chalk.red.underline : chalk.red
sha = style(sha)`,
        expected: `sha = (commit.head === true ? chalk.red.underline : chalk.red)(sha)`
      },
      {
        description: "arrow function",
        code: `const test[cursor] = bar => bar()
foo || test
test ? a : b
test()`,
        expected: `foo || (bar => bar())
(bar => bar()) ? a : b
(bar => bar())()`
      },
      {
        description: "object in arrow function body",
        code: `const test[cursor] = {}
const fn = () => test`,
        expected: `const fn = () => ({})`
      },
      {
        description: "assignment expression",
        code: `const test[cursor] = (a = 2)
1 + test
a = a || test`,
        expected: `1 + (a = 2)
a = a || (a = 2)`
      },
      {
        description: "assignment expression with increment",
        code: `const test[cursor] = (a += 2)
1 + test`,
        expected: "1 + (a += 2)"
      },
      {
        description: "awaited arrow function",
        code: `const test[cursor] = () => {}
async function fn() {
  await test;
}`,
        expected: `async function fn() {
  await (() => {});
}`
      },
      {
        description: "await expression",
        code: `const test[cursor] = await 1
test()`,
        expected: `(await 1)()`
      },
      {
        description: "class extension",
        code: `const test[cursor] = B ? C : D
class A extends test {}`,
        expected: `class A extends (B ? C : D) {}`
      },
      {
        description: "nullish coalescing",
        code: `const test[cursor] = a ?? b
test || c`,
        expected: `(a ?? b) || c`
      },
      {
        description: "void expression",
        code: `const test[cursor] = void 0
test?.()`,
        expected: `(void 0)?.()`
      },
      {
        description: "update expression",
        code: `const test[cursor] = ++a
new test`,
        expected: `new (++a)`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await inlineVariable(editor);

      expect(editor.code).toBe(expected);
    }
  );

  describe("multiple variables declaration", () => {
    it("should select the correct variable value (basic scenario)", async () => {
      const code = `const one = 1, [cursor]two = 2, three = 3;
const result = one + two + three;`;
      const editor = new InMemoryEditor(code);

      await inlineVariable(editor);

      expect(editor.code).toBe(`const one = 1, three = 3;
const result = one + 2 + three;`);
    });

    it("should select the correct variable value (last variable)", async () => {
      const code = `const one = 1, two = 2, [cursor]three = 3;
const result = one + two + three;`;
      const editor = new InMemoryEditor(code);

      await inlineVariable(editor);

      expect(editor.code).toBe(`const one = 1, two = 2;
const result = one + two + 3;`);
    });

    it("should select the correct variable value (first variable)", async () => {
      const code = `const [cursor]one = 1, two = 2, three = 3;
const result = one + two + three;`;
      const editor = new InMemoryEditor(code);

      await inlineVariable(editor);

      expect(editor.code).toBe(`const two = 2, three = 3;
const result = 1 + two + three;`);
    });

    it("should not inline code if cursor is not explicitly on one of the variables", async () => {
      const code = `const one = 1, two = 2, three = 3;
const result = one + two + three;`;
      const editor = new InMemoryEditor(code);
      jest.spyOn(editor, "showError");

      await inlineVariable(editor);

      expect(editor.showError).toHaveBeenCalledWith(
        ErrorReason.DidNotFindInlinableCode
      );
    });

    it("should work on multi-lines declarations", async () => {
      const code = `const one = 1,
  [cursor]two = 2,
  three = 3;
const result = one + two + three;`;
      const editor = new InMemoryEditor(code);

      await inlineVariable(editor);

      expect(editor.code).toBe(`const one = 1,
  three = 3;
const result = one + 2 + three;`);
    });

    it("should work on multi-lines declarations, with declaration on previous line", async () => {
      const code = `const one =
    1,
  [cursor]two =
    2,
  three =
    3;
const result = one + two + three;`;
      const editor = new InMemoryEditor(code);

      await inlineVariable(editor);

      expect(editor.code).toBe(`const one =
    1,
  three =
    3;
const result = one + 2 + three;`);
    });
  });

  // ✋ Patterns that can't be inlined

  it("should show an error message if selection is not inlinable", async () => {
    const code = `console.log("Nothing to inline here!")`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await inlineVariable(editor);

    expect(editor.showError).toHaveBeenCalledWith(
      ErrorReason.DidNotFindInlinableCode
    );
  });

  it("should show an error message if variable is not used", async () => {
    const code = `const hello = "Hello!";`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await inlineVariable(editor);

    expect(editor.showError).toHaveBeenCalledWith(
      ErrorReason.DidNotFindInlinableCodeIdentifiers
    );
  });

  it("should show an error message if type alias is not used", async () => {
    const code = `type Value = "one" | "many" | "none";`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await inlineVariable(editor);

    expect(editor.showError).toHaveBeenCalledWith(
      ErrorReason.DidNotFindInlinableCodeIdentifiers
    );
  });

  testEach<{ code: Code }>(
    "should not inline an exported variable",
    [
      {
        description: "export declaration",
        code: `export const foo = [cursor]"bar", hello = "world";
console.log(foo);`
      },
      {
        description: "export after declaration",
        code: `const foo = [cursor]"bar", hello = "world";
console.log(foo);

export { hello, foo };`
      },
      {
        description: "export before declaration",
        code: `export { foo };
const foo = [cursor]"bar", hello = "world";
console.log(foo);`
      },
      {
        description: "default export after declaration",
        code: `const foo = [cursor]"bar", hello = "world";
console.log(foo);

export default foo;`
      }
    ],
    async ({ code }) => {
      const editor = new InMemoryEditor(code);
      jest.spyOn(editor, "showError");

      await inlineVariable(editor);

      expect(editor.showError).toHaveBeenCalledWith(
        ErrorReason.CantInlineExportedVariables
      );
    }
  );

  testEach<{ code: Code }>(
    "should not inline an exported type alias",
    [
      {
        description: "export declaration",
        code: `export type [cursor]Value = "one" | "many" | "none";
interface Something {
  value: Value;
}`
      },
      {
        description: "export after declaration",
        code: `type Value = "one" | "many" | "none";
interface Something {
  value: Value;
}

export { Value };`
      },
      {
        description: "export before declaration",
        code: `export { Value };
[cursor]type Value = "one" | "many" | "none";
interface Something {
  value: Value;
}`
      },
      {
        description: "default export after declaration",
        code: `type Value = "one" | "many" | "none";
interface Something {
  value: Value;
}

export default Value;`
      }
    ],
    async ({ code }) => {
      const editor = new InMemoryEditor(code);
      jest.spyOn(editor, "showError");

      await inlineVariable(editor);

      expect(editor.showError).toHaveBeenCalledWith(
        ErrorReason.CantInlineExportedVariables
      );
    }
  );

  it("should not inline a redeclared variable", async () => {
    const code = `let h[cursor]ello = "Hello!";
console.log(hello);
hello = "World!";`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await inlineVariable(editor);

    expect(editor.showError).toHaveBeenCalledWith(
      ErrorReason.CantInlineRedeclaredVariables
    );
  });
});
