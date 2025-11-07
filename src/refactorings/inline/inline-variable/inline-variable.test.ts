import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { Code } from "../../../editor/editor";
import { inlineVariable } from "./inline-variable";

describe("Inline Variable", () => {
  describe("should select variable value if", () => {
    it("all variable declaration is selected", async () => {
      await shouldInlineVariable({
        code: `[start]const foo = "bar";[end]
console.log(foo);`,
        expected: `console.log("bar");`
      });
    });

    it("cursor is on value", async () => {
      await shouldInlineVariable({
        code: `const foo = [cursor]"bar";
console.log(foo);`,
        expected: `console.log("bar");`
      });
    });

    it("cursor is on identifier", async () => {
      await shouldInlineVariable({
        code: `const f[cursor]oo = "bar";
console.log(foo);`,
        expected: `console.log("bar");`
      });
    });

    it("cursor is on declarator", async () => {
      await shouldInlineVariable({
        code: `co[cursor]nst foo = "bar";
console.log(foo);`,
        expected: `console.log("bar");`
      });
    });
  });

  describe("should inline the variable value", () => {
    it("basic scenario", async () => {
      await shouldInlineVariable({
        code: `[start]const foo = "bar";[end]
const hello = "World!";
console.log(foo);`,
        expected: `const hello = "World!";
console.log("bar");`
      });
    });

    it("many references", async () => {
      await shouldInlineVariable({
        code: `[start]const hello = "Hel[end]lo!";
console.log(hello);
sendMessageSaying(hello).to(world);`,
        expected: `console.log("Hello!");
sendMessageSaying("Hello!").to(world);`
      });
    });

    it("property key with the same name", async () => {
      await shouldInlineVariable({
        code: `const hello = [cursor]"Hello!";
console.log({
  hello: hello
});`,
        expected: `console.log({
  hello: "Hello!"
});`
      });
    });

    it("property key, shorthand version", async () => {
      await shouldInlineVariable({
        code: `const hello = [cursor]"Hello!";
console.log({
  hello
});`,
        expected: `console.log({
  hello: "Hello!"
});`
      });
    });

    it("member expression with the same name", async () => {
      await shouldInlineVariable({
        code: `const wor[cursor]ld = props.world;
const helloWorld = sayHelloTo(world);
console.log(around.the.world);`,
        expected: `const helloWorld = sayHelloTo(props.world);
console.log(around.the.world);`
      });
    });

    it("variable declarator on a different line", async () => {
      await shouldInlineVariable({
        code: `const world =
  [cursor]"Hello!";
const helloWorld = sayHelloTo(world);`,
        expected: `const helloWorld = sayHelloTo("Hello!");`
      });
    });

    it("unary expression", async () => {
      await shouldInlineVariable({
        code: `const [cursor]isCorrect = "Hello!";
return !isCorrect;`,
        expected: `return !("Hello!");`
      });
    });

    it("object", async () => {
      await shouldInlineVariable({
        code: `const [cursor]foo = { value: "foo" };
console.log(foo.value);`,
        expected: `console.log({ value: "foo" }.value);`
      });
    });

    it("limited scope", async () => {
      await shouldInlineVariable({
        code: `function sayHello() {
  const hello [cursor]= "Hello!";
  console.log(hello);
}

console.log(hello);`,
        expected: `function sayHello() {
  console.log("Hello!");
}

console.log(hello);`
      });
    });

    it("shadowed variable", async () => {
      await shouldInlineVariable({
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
      });
    });

    it("shadowed variable in a lambda", async () => {
      await shouldInlineVariable({
        code: `const title[cursor] = document.title;
const lambda = (title: string) => title.length > 0;

return {title: title};`,
        expected: `const lambda = (title: string) => title.length > 0;

return {title: document.title};`
      });
    });

    it("shadowed variable in a method", async () => {
      await shouldInlineVariable({
        code: `const hello[cursor] = "Hello!";
console.log(hello);

fn({ set(hello) {} });`,
        expected: `console.log("Hello!");

fn({ set(hello) {} });`
      });
    });

    it("export outside of declaration scope", async () => {
      await shouldInlineVariable({
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
      });
    });

    it("type alias", async () => {
      await shouldInlineVariable({
        code: `type Value = "one" | "many" | "none";
interface Something {
  value: Value;
}`,
        expected: `interface Something {
  value: "one" | "many" | "none";
}`
      });
    });

    it("type alias, many references", async () => {
      await shouldInlineVariable({
        code: `type Value = "one" | "many" | "none";
interface Something {
  value: Value;
  otherValue: Value;
}`,
        expected: `interface Something {
  value: "one" | "many" | "none";
  otherValue: "one" | "many" | "none";
}`
      });
    });

    it("selected type alias only", async () => {
      await shouldInlineVariable({
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
      });
    });

    it("variable is computed", async () => {
      await shouldInlineVariable({
        code: `const foo[cursor] = "bar";
console.log({ [foo]: "Hello" });`,
        expected: `console.log({ ["bar"]: "Hello" });`
      });
    });

    it("variable is type-casted", async () => {
      await shouldInlineVariable({
        code: `const saveButton[cursor] = document.getElementById('btnSave') as HTMLButtonElement;
saveButton.disabled = true;
if (saveButton) {
  this.doSomethingElse(saveButton);
}`,
        expected: `(document.getElementById('btnSave') as HTMLButtonElement).disabled = true;
if (document.getElementById('btnSave') as HTMLButtonElement) {
  this.doSomethingElse(document.getElementById('btnSave') as HTMLButtonElement);
}`
      });
    });

    it("a JSX element into another", async () => {
      await shouldInlineVariable({
        code: `const header[cursor] = <h1>Hello</h1>;
const page = <div>{header}</div>;`,
        expected: `const page = <div><h1>Hello</h1></div>;`
      });
    });

    it("a JSX element into a JSX attribute", async () => {
      await shouldInlineVariable({
        code: `function MyComponent() {
  const header[cursor] = <span>hello</span>;
  return <Menu header={header} />
}`,
        expected: `function MyComponent() {
  return <Menu header={<span>hello</span>} />
}`
      });
    });

    it("a multi-lines JSX element into another", async () => {
      await shouldInlineVariable({
        code: `const header[cursor] = (
  <h1>Hello</h1>
);
const page = <div>{header}</div>;`,
        expected: `const page = <div><h1>Hello</h1></div>;`
      });
    });

    it("a string literal inside a template literal", async () => {
      await shouldInlineVariable({
        code: `const name[cursor] = "world!";
console.log(\`Hello \${name}\`);`,
        expected: `console.log(\`Hello world!\`);`
      });
    });

    it("a number literal inside a template literal", async () => {
      await shouldInlineVariable({
        code: `const age[cursor] = 23;
console.log(\`I am \${age}\`);`,
        expected: `console.log(\`I am 23\`);`
      });
    });

    it("an expression inside a template literal", async () => {
      await shouldInlineVariable({
        code: `const authToken = AuthStore.get("authToken");
log(\`Bearer \${authToken}\`)`,
        expected: `log(\`Bearer \${AuthStore.get("authToken")}\`)`
      });
    });

    it("a multi-lines string inside a template literal", async () => {
      await shouldInlineVariable({
        code: `const name[cursor] = \`world!

How are you doing?\`;
console.log(\`Hello \${name}\`);`,
        expected: `console.log(\`Hello world!

How are you doing?\`);`
      });
    });

    it("with the satisfies operator", async () => {
      await shouldInlineVariable({
        code: `[start]const foo = "bar";[end]
const hello = "World!";
console.log(foo satisfies string);`,
        expected: `const hello = "World!";
console.log("bar" satisfies string);`
      });
    });

    it("a variable declaration that is an async arrow expression", async () => {
      await shouldInlineVariable({
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
      });
    });
  });

  it("member expression property", async () => {
    await shouldInlineVariable({
      code: `const wor[cursor]ld = props.data.id;
sayHelloTo(usersData[world]);`,
      expected: `sayHelloTo(usersData[props.data.id]);`
    });
  });

  async function shouldInlineVariable({
    code,
    expected
  }: {
    code: Code;
    expected: Code;
  }) {
    const editor = new InMemoryEditor(code);
    const result = inlineVariable({
      state: "new",
      code: editor.code,
      selection: editor.selection
    });

    if (result.action !== "read then write") {
      throw new Error(`Expected "read then write" but got "${result.action}"`);
    }

    await editor.readThenWrite(
      result.readSelection,
      result.getModifications,
      result.newCursorPosition
    );

    expect(editor.code).toBe(expected);
  }

  describe("preserve parenthesis around inlined expression", () => {
    it("should do this for binary expressions", async () => {
      await shouldInlineVariable({
        code: `const someValue[cursor] = a + b
const result = someValue * 100`,
        expected: `const result = (a + b) * 100`
      });
    });
  });

  describe("should preserve parenthesis around inlined variable", () => {
    it("binary expression", async () => {
      await shouldInlineVariable({
        code: `const someValue[cursor] = a + b
const result = someValue * 100`,
        expected: `const result = (a + b) * 100`
      });
    });

    it("binary expression in function call", async () => {
      await shouldInlineVariable({
        code: `const style[cursor] = commit.head === true ? chalk.red.underline : chalk.red
sha = style(sha)`,
        expected: `sha = (commit.head === true ? chalk.red.underline : chalk.red)(sha)`
      });
    });

    it("arrow function", async () => {
      await shouldInlineVariable({
        code: `const test[cursor] = bar => bar()
foo || test
test ? a : b
test()`,
        expected: `foo || (bar => bar())
(bar => bar()) ? a : b
(bar => bar())()`
      });
    });

    it("object in arrow function body", async () => {
      await shouldInlineVariable({
        code: `const test[cursor] = {}
const fn = () => test`,
        expected: `const fn = () => ({})`
      });
    });

    it("assignment expression", async () => {
      await shouldInlineVariable({
        code: `const test[cursor] = (a = 2)
1 + test
a = a || test`,
        expected: `1 + (a = 2)
a = a || (a = 2)`
      });
    });

    it("assignment expression with increment", async () => {
      await shouldInlineVariable({
        code: `const test[cursor] = (a += 2)
1 + test`,
        expected: "1 + (a += 2)"
      });
    });

    it("awaited arrow function", async () => {
      await shouldInlineVariable({
        code: `const test[cursor] = () => {}
async function fn() {
  await test;
}`,
        expected: `async function fn() {
  await (() => {});
}`
      });
    });

    it("await expression", async () => {
      await shouldInlineVariable({
        code: `const test[cursor] = await 1
test()`,
        expected: `(await 1)()`
      });
    });

    it("class extension", async () => {
      await shouldInlineVariable({
        code: `const test[cursor] = B ? C : D
class A extends test {}`,
        expected: `class A extends (B ? C : D) {}`
      });
    });

    it("nullish coalescing", async () => {
      await shouldInlineVariable({
        code: `const test[cursor] = a ?? b
test || c`,
        expected: `(a ?? b) || c`
      });
    });

    it("void expression", async () => {
      await shouldInlineVariable({
        code: `const test[cursor] = void 0
test?.()`,
        expected: `(void 0)?.()`
      });
    });

    it("update expression", async () => {
      await shouldInlineVariable({
        code: `const test[cursor] = ++a
new test`,
        expected: `new (++a)`
      });
    });
  });

  describe("multiple variables declaration", () => {
    it("should select the correct variable value (basic scenario)", async () => {
      await shouldInlineVariable({
        code: `const one = 1, [cursor]two = 2, three = 3;
const result = one + two + three;`,
        expected: `const one = 1, three = 3;
const result = one + 2 + three;`
      });
    });

    it("should select the correct variable value (last variable)", async () => {
      await shouldInlineVariable({
        code: `const one = 1, two = 2, [cursor]three = 3;
const result = one + two + three;`,
        expected: `const one = 1, two = 2;
const result = one + two + 3;`
      });
    });

    it("should select the correct variable value (first variable)", async () => {
      await shouldInlineVariable({
        code: `const [cursor]one = 1, two = 2, three = 3;
const result = one + two + three;`,
        expected: `const two = 2, three = 3;
const result = 1 + two + three;`
      });
    });

    it("should not inline code if cursor is not explicitly on one of the variables", () => {
      shouldNotInlineVariable({
        code: `const one = 1, two = 2, three = 3;
const result = one + two + three;`,
        expectedError: "inlinable code"
      });
    });

    it("should work on multi-lines declarations", async () => {
      await shouldInlineVariable({
        code: `const one = 1,
  [cursor]two = 2,
  three = 3;
const result = one + two + three;`,
        expected: `const one = 1,
  three = 3;
const result = one + 2 + three;`
      });
    });

    it("should work on multi-lines declarations, with declaration on previous line", async () => {
      await shouldInlineVariable({
        code: `const one =
    1,
  [cursor]two =
    2,
  three =
    3;
const result = one + two + three;`,
        expected: `const one =
    1,
  three =
    3;
const result = one + 2 + three;`
      });
    });
  });

  // ✋ Patterns that can't be inlined

  it("should show an error message if selection is not inlinable", () => {
    shouldNotInlineVariable({
      code: `console.log("Nothing to inline here!")`,
      expectedError: "inlinable code"
    });
  });

  it("should show an error message if variable is not used", () => {
    shouldNotInlineVariable({
      code: `const hello = "Hello!";`,
      expectedError: "identifiers to inline"
    });
  });

  it("should show an error message if type alias is not used", () => {
    shouldNotInlineVariable({
      code: `type Value = "one" | "many" | "none";`,
      expectedError: "identifiers to inline"
    });
  });

  describe("should not inline an exported variable", () => {
    it("export declaration", () => {
      shouldNotInlineVariable({
        code: `export const foo = [cursor]"bar", hello = "world";
console.log(foo);`,
        expectedError: "inline exported variables"
      });
    });

    it("export after declaration", () => {
      shouldNotInlineVariable({
        code: `const foo = [cursor]"bar", hello = "world";
console.log(foo);

export { hello, foo };`,
        expectedError: "inline exported variables"
      });
    });

    it("export before declaration", () => {
      shouldNotInlineVariable({
        code: `export { foo };
const foo = [cursor]"bar", hello = "world";
console.log(foo);`,
        expectedError: "inline exported variables"
      });
    });

    it("default export after declaration", () => {
      shouldNotInlineVariable({
        code: `const foo = [cursor]"bar", hello = "world";
console.log(foo);

export default foo;`,
        expectedError: "inline exported variables"
      });
    });
  });

  describe("should not inline an exported type alias", () => {
    it("export declaration", () => {
      shouldNotInlineVariable({
        code: `export type [cursor]Value = "one" | "many" | "none";
interface Something {
  value: Value;
}`,
        expectedError: "inline exported variables"
      });
    });

    it("export after declaration", () => {
      shouldNotInlineVariable({
        code: `type Value = "one" | "many" | "none";
interface Something {
  value: Value;
}

export { Value };`,
        expectedError: "inline exported variables"
      });
    });

    it("export before declaration", () => {
      shouldNotInlineVariable({
        code: `export { Value };
[cursor]type Value = "one" | "many" | "none";
interface Something {
  value: Value;
}`,
        expectedError: "inline exported variables"
      });
    });

    it("default export after declaration", () => {
      shouldNotInlineVariable({
        code: `type Value = "one" | "many" | "none";
interface Something {
  value: Value;
}

export default Value;`,
        expectedError: "inline exported variables"
      });
    });
  });

  it("should not inline a redeclared variable", () => {
    shouldNotInlineVariable({
      code: `let h[cursor]ello = "Hello!";
console.log(hello);
hello = "World!";`,
      expectedError: "inline redeclared variables"
    });
  });
});

function shouldNotInlineVariable({
  code,
  expectedError
}: {
  code: Code;
  expectedError: string;
}) {
  const editor = new InMemoryEditor(code);
  const result = inlineVariable({
    state: "new",
    code: editor.code,
    selection: editor.selection
  });

  if (result.action !== "show error") {
    throw new Error(`Expected "show error" but got "${result.action}"`);
  }

  expect(result.reason).toContain(expectedError);
}
