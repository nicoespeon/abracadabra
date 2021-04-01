import { Code } from "../../../editor/editor";
import { Selection } from "../../../editor/selection";
import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { testEach } from "../../../tests-helpers";

import { extractVariable } from "./extract-variable";
import { DestructureStrategy } from "./destructure-strategy";

describe("Extract Variable - Objects we can extract", () => {
  testEach<{
    code: Code;
    expected: Code;
    shouldPreserve?: boolean;
  }>(
    "should extract",
    [
      {
        description: "an object",
        code: `console.log([cursor]{ one: 1, foo: true, hello: 'World!' });`,
        expected: `const extracted = { one: 1, foo: true, hello: 'World!' };
console.log(extracted);`
      },
      {
        description: "an object (multi-lines)",
        code: `console.log([cursor]{
  one: 1,
  foo: true,
  hello: 'World!'
});`,
        expected: `const extracted = {
  one: 1,
  foo: true,
  hello: 'World!'
};
console.log(extracted);`
      },
      {
        description: "a multi-lines object when cursor is inside",
        code: `console.log({
  one: 1,
  f[cursor]oo: true,
  hello: 'World!'
});`,
        expected: `const extracted = {
  one: 1,
  foo: true,
  hello: 'World!'
};
console.log(extracted);`
      },
      {
        description: "an element nested in a multi-lines object",
        code: `console.log({
  one: 1,
  foo: {
    bar: [cursor]"Hello!"
  }
});`,
        expected: `const bar = "Hello!";
console.log({
  one: 1,
  foo: {
    bar
  }
});`
      },
      {
        description: "an object property value (not the last one)",
        code: `console.log({
  hello: [cursor]"World",
  goodbye: "my old friend"
});`,
        expected: `const hello = "World";
console.log({
  hello[cursor],
  goodbye: "my old friend"
});`
      },
      {
        description: "an object property value which key is not in camel case",
        code: `console.log({
  hello_world: "[cursor]World",
  goodbye: "my old friend"
});`,
        expected: `const hello_world = "World";
console.log({
  hello_world,
  goodbye: "my old friend"
});`
      },
      {
        description: "an object property value which key is too long",
        code: `console.log({
  somethingVeryVeryVeryLong: doSo[cursor]mething()
});`,
        expected: `const somethingVeryVeryVeryLong = doSomething();
console.log({
  somethingVeryVeryVeryLong
});`
      },
      {
        description: "an object property value which key is a keyword",
        code: `console.log({
  const: doS[cursor]omething()
});`,
        expected: `const extracted = doSomething();
console.log({
  const: extracted
});`
      },
      {
        description: "an object property value which key is a string",
        code: `console.log({
  "hello.world": d[cursor]oSomething()
});`,
        expected: `const extracted = doSomething();
console.log({
  "hello.world": extracted
});`
      },
      {
        description:
          "an element nested in a multi-lines object that is assigned to a variable",
        code: `const a = {
  one: 1,
  foo: {
    bar: [cursor]"Hello!"
  }
};`,
        expected: `const bar = "Hello!";
const a = {
  one: 1,
  foo: {
    bar
  }
};`
      },
      {
        description: "the whole object when cursor is on its property",
        code: `console.log({ fo[cursor]o: "bar", one: true });`,
        expected: `const extracted = { foo: "bar", one: true };
console.log(extracted);`
      },
      {
        description: "a computed object property",
        code: `const a = { [[cursor]key]: "value" };`,
        expected: `const extracted = key;
const a = { [extracted]: "value" };`
      },
      {
        description: "a computed object property value when cursor is on value",
        code: `const a = { [key]: [cursor]"value" };`,
        expected: `const extracted = "value";
const a = { [key]: extracted };`
      },
      {
        description: "the whole object when cursor is on a method declaration",
        code: `console.log({
  [cursor]getFoo() {
    return "bar";
  }
});`,
        expected: `const extracted = {
  getFoo() {
    return "bar";
  }
};
console.log(extracted);`
      },
      {
        description:
          "the nested object when cursor is on nested object property",
        code: `console.log({ foo: { [cursor]bar: true } });`,
        expected: `const foo = { bar: true };
console.log({ foo });`
      },
      {
        description: "an object returned from arrow function",
        code: `const something = () => ({
  foo: "b[cursor]ar"
});`,
        expected: `const foo = "bar";
const something = () => ({
  foo
});`
      },
      {
        description: "an object from a nested call expression",
        code: `assert.isTrue(
  getError({ co[cursor]ntext: ["value"] })
);`,
        expected: `const extracted = { context: ["value"] };
assert.isTrue(
  getError(extracted)
);`
      },
      {
        description: "a property to destructure",
        code: `console.log(foo.bar.b[cursor]az);`,
        expected: `const { baz } = foo.bar;
console.log(baz);`
      },
      {
        description: "a property to destructure from an existing assignment",
        code: `const { x } = obj;
function someScope() {
  function test() {
    return x + obj.y[cursor] * x;
  }
}`,
        expected: `const { x, y } = obj;
function someScope() {
  function test() {
    return x + y[cursor] * x;
  }
}`
      },
      {
        description:
          "a property to destructure from an existing assignment, but user decides to preserve",
        code: `function test() {
  const { x } = obj;
  return x + obj.y[cursor] * x;
}`,
        shouldPreserve: true,
        expected: `function test() {
  const { x } = obj;
  const y = obj.y;
  return x + y[cursor] * x;
}`
      },
      {
        description:
          "a property to destructure, existing assignment in different scope",
        code: `{
  const { x } = obj;
  console.log(x);
}
function test() {
  return obj.y[cursor];
}`,
        expected: `{
  const { x } = obj;
  console.log(x);
}
function test() {
  const { y } = obj;
  return y[cursor];
}`
      }
    ],
    async ({ code, expected, shouldPreserve }) => {
      const editor = new InMemoryEditor(code);
      jest
        .spyOn(editor, "askUserChoice")
        .mockImplementation(([destructure, preserve]) =>
          Promise.resolve(shouldPreserve ? preserve : destructure)
        );

      await extractVariable(editor);

      const {
        code: expectedCode,
        selection: expectedSelection
      } = new InMemoryEditor(expected);

      expect(editor.code).toBe(expectedCode);
      if (!expectedSelection.isCursorAtTopOfDocument) {
        expect(editor.selection).toStrictEqual(expectedSelection);
      }
    }
  );

  it("should ask if user wants to destructure or not", async () => {
    const code = `console.log(foo.bar.b[cursor]az)`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "askUserChoice");

    await extractVariable(editor);

    expect(editor.askUserChoice).toBeCalledWith([
      {
        label: "Destructure => `const { baz } = foo.bar`",
        value: DestructureStrategy.Destructure
      },
      {
        label: "Preserve => `const baz = foo.bar.baz`",
        value: DestructureStrategy.Preserve
      }
    ]);
  });

  it("should not ask to destructure computed member expressions", async () => {
    const code = `console.log([start]foo.bar.children[0][end].selection)`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "askUserChoice");

    await extractVariable(editor);

    expect(editor.askUserChoice).not.toBeCalled();
  });

  it("should not ask if user wants to destructure if it can't be", async () => {
    const code = `console.log([cursor]"hello")`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "askUserChoice");

    await extractVariable(editor);

    expect(editor.askUserChoice).not.toBeCalled();
  });

  it("should preserve member expression if user says so", async () => {
    const code = `console.log(foo.bar.b[cursor]az);`;
    const editor = new InMemoryEditor(code);
    jest
      .spyOn(editor, "askUserChoice")
      .mockImplementation(([, preserve]) => Promise.resolve(preserve));

    await extractVariable(editor);

    expect(editor.code).toBe(`const baz = foo.bar.baz;
console.log(baz);`);
  });

  it("should rename the correct identifier for multiple occurrences on the same line", async () => {
    const code = `console.log(data.response.code, data.response[cursor].user.id, data.response.user.name);`;
    const editor = new InMemoryEditor(code);

    await extractVariable(editor);

    expect(editor.code).toBe(`const { response } = data;
console.log(response.code, response.user.id, response.user.name);`);
    expect(editor.selection).toStrictEqual(Selection.cursorAt(1, 35));
  });
});
