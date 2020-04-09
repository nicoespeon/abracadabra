import { Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { Position } from "../../editor/position";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { extractVariable } from "./extract-variable";

describe("Extract Variable - Objects we can extract", () => {
  testEach<{
    code: Code;
    selection: Selection;
    expected: Code;
    expectedPosition?: Position;
  }>(
    "should extract",
    [
      {
        description: "an object",
        code: `console.log({ one: 1, foo: true, hello: 'World!' });`,
        selection: Selection.cursorAt(0, 12),
        expected: `const extracted = { one: 1, foo: true, hello: 'World!' };
console.log(extracted);`
      },
      {
        description: "an object (multi-lines)",
        code: `console.log({
  one: 1,
  foo: true,
  hello: 'World!'
});`,
        selection: Selection.cursorAt(0, 12),
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
  foo: true,
  hello: 'World!'
});`,
        selection: Selection.cursorAt(2, 3),
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
    bar: "Hello!"
  }
});`,
        selection: Selection.cursorAt(3, 9),
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
  hello: "World",
  goodbye: "my old friend"
});`,
        selection: Selection.cursorAt(1, 9),
        expected: `const hello = "World";
console.log({
  hello,
  goodbye: "my old friend"
});`,
        expectedPosition: new Position(2, 7)
      },
      {
        description: "an object property value which key is not in camel case",
        code: `console.log({
  hello_world: "World",
  goodbye: "my old friend"
});`,
        selection: Selection.cursorAt(1, 16),
        expected: `const hello_world = "World";
console.log({
  hello_world,
  goodbye: "my old friend"
});`
      },
      {
        description: "an object property value which key is too long",
        code: `console.log({
  somethingVeryVeryVeryLong: doSomething()
});`,
        selection: Selection.cursorAt(1, 33),
        expected: `const somethingVeryVeryVeryLong = doSomething();
console.log({
  somethingVeryVeryVeryLong
});`
      },
      {
        description: "an object property value which key is a keyword",
        code: `console.log({
  const: doSomething()
});`,
        selection: Selection.cursorAt(1, 12),
        expected: `const extracted = doSomething();
console.log({
  const: extracted
});`
      },
      {
        description:
          "an element nested in a multi-lines object that is assigned to a variable",
        code: `const a = {
  one: 1,
  foo: {
    bar: "Hello!"
  }
};`,
        selection: Selection.cursorAt(3, 9),
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
        code: `console.log({ foo: "bar", one: true });`,
        selection: Selection.cursorAt(0, 16),
        expected: `const extracted = { foo: "bar", one: true };
console.log(extracted);`
      },
      {
        description: "a computed object property",
        code: `const a = { [key]: "value" };`,
        selection: Selection.cursorAt(0, 13),
        expected: `const extracted = key;
const a = { [extracted]: "value" };`
      },
      {
        description: "a computed object property value when cursor is on value",
        code: `const a = { [key]: "value" };`,
        selection: Selection.cursorAt(0, 19),
        expected: `const extracted = "value";
const a = { [key]: extracted };`
      },
      {
        description: "the whole object when cursor is on a method declaration",
        code: `console.log({
  getFoo() {
    return "bar";
  }
});`,
        selection: Selection.cursorAt(1, 2),
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
        code: `console.log({ foo: { bar: true } });`,
        selection: Selection.cursorAt(0, 21),
        expected: `const foo = { bar: true };
console.log({ foo });`
      },
      {
        description: "an object returned from arrow function",
        code: `const something = () => ({
  foo: "bar"
});`,
        selection: Selection.cursorAt(1, 9),
        expected: `const foo = "bar";
const something = () => ({
  foo
});`
      },
      {
        description: "an object from a nested call expression",
        code: `assert.isTrue(
  getError({ context: ["value"] })
);`,
        selection: Selection.cursorAt(1, 15),
        expected: `const extracted = { context: ["value"] };
assert.isTrue(
  getError(extracted)
);`
      }
    ],
    async ({ code, selection, expected, expectedPosition }) => {
      const result = await doExtractVariable(code, selection);
      expect(result.code).toBe(expected);

      if (expectedPosition) {
        expect(result.position).toStrictEqual(expectedPosition);
      }
    }
  );

  async function doExtractVariable(
    code: Code,
    selection: Selection
  ): Promise<{ code: Code; position: Position }> {
    const editor = new InMemoryEditor(code);
    await extractVariable(code, selection, editor);
    return { code: editor.code, position: editor.position };
  }
});
