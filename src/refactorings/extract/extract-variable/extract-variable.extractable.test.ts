import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { Code } from "../../../editor/editor";
import { extractVariable } from "./extract-variable";

describe("Extract Variable - Patterns we can extract", () => {
  describe("should extract", () => {
    it("a number", async () => {
      await shouldExtractVariable({
        code: `console.log([cursor]12.5);`,
        expected: `const extracted = 12.5;
console.log(extracted);`
      });
    });

    it("a boolean", async () => {
      await shouldExtractVariable({
        code: `console.log([cursor]false);`,
        expected: `const extracted = false;
console.log(extracted);`
      });
    });

    it("null", async () => {
      await shouldExtractVariable({
        code: `console.log([cursor]null);`,
        expected: `const extracted = null;
console.log(extracted);`
      });
    });

    it("undefined", async () => {
      await shouldExtractVariable({
        code: `console.log([cursor]undefined);`,
        expected: `const extracted = undefined;
console.log(extracted);`
      });
    });

    it("an array", async () => {
      await shouldExtractVariable({
        code: `console.log([cursor][1, 2, 'three', [true, null]]);`,
        expected: `const extracted = [1, 2, 'three', [true, null]];
console.log(extracted);`
      });
    });

    it("an array (multi-lines)", async () => {
      await shouldExtractVariable({
        code: `console.log([cursor][
  1,
  'Two',
  [true, null]
]);`,
        expected: `const extracted = [
  1,
  'Two',
  [true, null]
];
console.log(extracted);`
      });
    });

    it("a named function", async () => {
      await shouldExtractVariable({
        code: `console.log([cursor]function sayHello() {
  return "Hello!";
});`,
        expected: `const extracted = function sayHello() {
  return "Hello!";
};
console.log(extracted);`
      });
    });

    it("an arrow function", async () => {
      await shouldExtractVariable({
        code: `console.log([cursor]() => "Hello!");`,
        expected: `const extracted = () => "Hello!";
console.log(extracted);`
      });
    });

    it("a function call", async () => {
      await shouldExtractVariable({
        code: `console.log([cursor]sayHello("World"));`,
        expected: `const extracted = sayHello("World");
console.log(extracted);`
      });
    });

    it("the correct variable when we have many", async () => {
      await shouldExtractVariable({
        code: `console.log("Hello");
console.log("the", [cursor]"World!", "Alright.");
console.log("How are you doing?");`,
        expected: `console.log("Hello");
const world = "World!";
console.log("the", world, "Alright.");
console.log("How are you doing?");`
      });
    });

    it("an element in a multi-lines array", async () => {
      await shouldExtractVariable({
        code: `const SUPPORTED_LANGUAGES = [
  "javascript",
  [cursor]"javascriptreact",
  "typescript",
  "typescriptreact"
];`,
        expected: `const javascriptreact = "javascriptreact";
const SUPPORTED_LANGUAGES = [
  "javascript",
  javascriptreact,
  "typescript",
  "typescriptreact"
];`
      });
    });

    it("an element nested in a multi-lines array", async () => {
      await shouldExtractVariable({
        code: `console.log([
  1,
  [
    {
      hello: [cursor]"Hello!"
    }
  ]
]);`,
        expected: `const hello = "Hello!";
console.log([
  1,
  [
    {
      hello
    }
  ]
]);`
      });
    });

    it("a spread variable", async () => {
      await shouldExtractVariable({
        code: `console.log({ ...foo.b[cursor]ar });`,
        expected: `const { bar } = foo;
console.log({ ...bar });`
      });
    });

    it("a spread variable, cursor on spread", async () => {
      await shouldExtractVariable({
        code: `console.log({ ..[cursor].foo.bar });`,
        expected: `const extracted = { ...foo.bar };
console.log(extracted);`
      });
    });

    it("a spread function result", async () => {
      await shouldExtractVariable({
        code: `console.log({
  ...getInl[cursor]inableCode(declaration),
  id: "name"
});`,
        expected: `const extracted = getInlinableCode(declaration);
console.log({
  ...extracted,
  id: "name"
});`
      });
    });

    it("a valid path when cursor is on a part of member expression", async () => {
      await shouldExtractVariable({
        code: `console.log(path.[cursor]node.name);`,
        expected: `const { node } = path;
console.log(node.name);`
      });
    });

    it("a valid path when cursor is on the first parent of the member expression", async () => {
      await shouldExtractVariable({
        code: `console.log([cursor]path.node.name);`,
        expected: `const extracted = path;
console.log(extracted.node.name);`
      });
    });

    it("a member expression when property name is not in camel case", async () => {
      await shouldExtractVariable({
        code: `console.log(path.[cursor]some_node.name);`,
        expected: `const { some_node } = path;
console.log(some_node.name);`
      });
    });

    it("a member expression when property name is too long", async () => {
      await shouldExtractVariable({
        code: `console.log(path.[cursor]somethingVeryVeryVeryLongThatWontFit.name);`,
        expected: `const { somethingVeryVeryVeryLongThatWontFit } = path;
console.log(somethingVeryVeryVeryLongThatWontFit.name);`
      });
    });

    it("member expression with computed value", async () => {
      await shouldExtractVariable({
        code: `console.log(this.items[[cursor]i].name);`,
        expected: `const extracted = this.items[i];
console.log(extracted.name);`
      });
    });

    it("member expression in a for..of statement", async () => {
      await shouldExtractVariable({
        code: `for (const el of foo.bar.[cursor]list) {}`,
        expected: `const { list } = foo.bar;
for (const el of list) {}`
      });
    });

    it("a return value of a function", async () => {
      await shouldExtractVariable({
        code: `function getMessage() {
  return [cursor]"Hello!";
}`,
        expected: `function getMessage() {
  const hello = "Hello!";
  return hello;
}`
      });
    });

    it("an assigned variable", async () => {
      await shouldExtractVariable({
        code: `const message = [cursor]"Hello!";`,
        expected: `const hello = "Hello!";
const message = hello;`
      });
    });

    it("a class property assignment", async () => {
      await shouldExtractVariable({
        code: `class Logger {
  message = [cursor]"Hello!";
}`,
        expected: `const hello = "Hello!";
class Logger {
  message = hello;
}`
      });
    });

    it("a computed class property", async () => {
      await shouldExtractVariable({
        code: `class Logger {
  [[cursor]key] = "value";
}`,
        expected: `const extracted = key;
class Logger {
  [extracted] = "value";
}`
      });
    });

    it("an if statement (whole statement)", async () => {
      await shouldExtractVariable({
        code: `if ([start]parents.length > 0 && type === 'refactor'[end]) doSomething();`,
        expected: `const extracted = parents.length > 0 && type === 'refactor';
if (extracted) doSomething();`
      });
    });

    it("an if statement (part of it)", async () => {
      await shouldExtractVariable({
        code: `if ([start]parents.length > 0[end] && type === 'refactor') doSomething();`,
        expected: `const extracted = parents.length > 0;
if (extracted && type === 'refactor') doSomething();`
      });
    });

    it("a multi-lines if statement (whole statement)", async () => {
      await shouldExtractVariable({
        code: `if (
  [start]parents.length > 0 &&
  type === 'refactor'[end]
) doSomething();`,
        expected: `const extracted = parents.length > 0 &&
  type === 'refactor';
if (
  extracted
) doSomething();`
      });
    });

    it("a multi-lines if statement (part of it)", async () => {
      await shouldExtractVariable({
        code: `if (
  parents.length > 0 &&
  [start]type === 'refactor'[end]
) doSomething();`,
        expected: `const extracted = type === 'refactor';
if (
  parents.length > 0 &&
  extracted
) doSomething();`
      });
    });

    it("if statement, cursor on else clause", async () => {
      await shouldExtractVariable({
        code: `if (isMorning) {
  sayGoodMorning();
} else if ([cursor]isAfternoon) {
  sayHello();
}`,
        expected: `const extracted = isAfternoon;
if (isMorning) {
  sayGoodMorning();
} else if (extracted) {
  sayHello();
}`
      });
    });

    it("a while statement", async () => {
      await shouldExtractVariable({
        code: `while ([start]parents.length > 0 && type === 'refactor'[end]) doSomething();`,
        expected: `const extracted = parents.length > 0 && type === 'refactor';
while (extracted) doSomething();`
      });
    });

    it("a case statement", async () => {
      await shouldExtractVariable({
        code: `switch (text) {
  case [cursor]"Hello!":
  default:
    break;
}`,
        expected: `const hello = "Hello!";
switch (text) {
  case hello:
  default:
    break;
}`
      });
    });

    it("an unamed function parameter when cursor is inside", async () => {
      await shouldExtractVariable({
        code: `console.log(function () {
[cursor]  return "Hello!";
});`,
        expected: `const extracted = function () {
  return "Hello!";
};
console.log(extracted);`
      });
    });

    it("an exported variable declaration", async () => {
      await shouldExtractVariable({
        code: `export const something = {
  foo: "b[cursor]ar"
};`,
        expected: `const foo = "bar";
export const something = {
  foo
};`
      });
    });

    it("a default export", async () => {
      await shouldExtractVariable({
        code: `export default "s[cursor]omething";`,
        expected: `const something = "something";
export default something;`
      });
    });

    it("a default export (without trailing semicolon)", async () => {
      await shouldExtractVariable({
        code: `export default "s[cursor]omething"`,
        expected: `const something = "something";
export default something`
      });
    });

    it("a default export (with spaces after semicolon)", async () => {
      await shouldExtractVariable({
        code: `export default "s[cursor]omething";   `,
        expected: `const something = "something";
export default something;   `
      });
    });

    it("a default export (with comment after semicolon)", async () => {
      await shouldExtractVariable({
        code: `export default "s[cursor]omething"; // Do something`,
        expected: `const something = "something";
export default something; // Do something`
      });
    });

    it("a default export (multiple lines)", async () => {
      await shouldExtractVariable({
        code: `export default {[cursor]
  tryTo: "extract me"
};`,
        expected: `const extracted = {
  tryTo: "extract me"
};
export default extracted;`
      });
    });

    it("a default export (with statement after that has no semicolon)", async () => {
      await shouldExtractVariable({
        code: `export default "[cursor]something";
console.log("done")`,
        expected: `const something = "something";
export default something;
console.log("done")`
      });
    });

    it("a value inside an arrow function", async () => {
      await shouldExtractVariable({
        code: `() => (
  console.log("H[cursor]ello")
)`,
        expected: `const hello = "Hello";
() => (
  console.log(hello)
)`
      });
    });

    it("a multi-lines ternary", async () => {
      await shouldExtractVariable({
        code: `function getText() {
  return isValid
    ? "y[cursor]es"
    : "no";
}`,
        expected: `function getText() {
  const yes = "yes";
  return isValid
    ? yes
    : "no";
}`
      });
    });

    it("a multi-lines unary expression", async () => {
      await shouldExtractVariable({
        code: `if (
  !(threshold > 1[cursor]0 || isPaused)
) {
  console.log("Ship it");
}`,
        expected: `const extracted = 10;
if (
  !(threshold > extracted || isPaused)
) {
  console.log("Ship it");
}`
      });
    });

    it("a class instantiation (cursor on new expression)", async () => {
      await shouldExtractVariable({
        code: `console.log([cursor]new Card("jack"));`,
        expected: `const card = new Card("jack");
console.log(card);`
      });
    });

    it("a class instantiation (cursor on class identifier)", async () => {
      await shouldExtractVariable({
        code: `console.log(new [cursor]Card("jack"));`,
        expected: `const card = new Card("jack");
console.log(card);`
      });
    });

    it("a thrown error", async () => {
      await shouldExtractVariable({
        code: `throw new Er[cursor]ror("It failed");`,
        expected: `const error = new Error("It failed");
throw error;`
      });
    });

    it("a call expression parameter (multi-lines)", async () => {
      await shouldExtractVariable({
        code: `createIfStatement(
  parentPath.node.op[cursor]erator,
  parentPath.node.left,
  node.consequent
);`,
        expected: `const { operator } = parentPath.node;
createIfStatement(
  operator,
  parentPath.node.left,
  node.consequent
);`
      });
    });

    it("a conditional expression (multi-lines)", async () => {
      await shouldExtractVariable({
        code: `const type = !!(
  path.node.loc.l[cursor]ength > 0
) ? "with-loc"
  : "without-loc";`,
        expected: `const { length } = path.node.loc;
const type = !!(
  length > 0
) ? "with-loc"
  : "without-loc";`
      });
    });

    it("a value in a new Expression", async () => {
      await shouldExtractVariable({
        code: `new Author(
  [cursor]"name"
);`,
        expected: `const name = "name";
new Author(
  name
);`
      });
    });

    it("a value in an Array argument of a function", async () => {
      await shouldExtractVariable({
        code: `doSomething([
  [cursor]getValueOf("name")
]);`,
        expected: `const extracted = getValueOf("name");
doSomething([
  extracted
]);`
      });
    });

    it("a new Expression in an Array argument of a function", async () => {
      await shouldExtractVariable({
        code: `doSomething([
  [cursor]new Author("Eliott")
]);`,
        expected: `const author = new Author("Eliott");
doSomething([
  author
]);`
      });
    });

    it("a value in a binary expression", async () => {
      await shouldExtractVariable({
        code: `console.log(
  currentValue >
  [cursor]10
);`,
        expected: `const extracted = 10;
console.log(
  currentValue >
  extracted
);`
      });
    });

    it("an arrow function (cursor on params)", async () => {
      await shouldExtractVariable({
        code: `const sayHello = (na[cursor]me) => {
  console.log(name);
};`,
        expected: `const extracted = (name) => {
  console.log(name);
};
const sayHello = extracted;`
      });
    });

    it("a for statement", async () => {
      await shouldExtractVariable({
        code: `for (var i = 0; i < this.it[cursor]ems.length; i++) {}`,
        expected: `const { items } = this;
for (var i = 0; i < items.length; i++) {}`
      });
    });

    it("with tabs", async () => {
      await shouldExtractVariable({
        code: `function test() {
	const myVar = {
		someArray: [{ somethingNested: 42 }]
	};
	console.log(myVar.someAr[cursor]ray[0].somethingNested);
}`,
        expected: `function test() {
	const myVar = {
		someArray: [{ somethingNested: 42 }]
	};
	const { someArray } = myVar;
	console.log(someArray[0].somethingNested);
}`
      });
    });

    it("cursor on return keyword", async () => {
      await shouldExtractVariable({
        code: `function addNumbers(arr: number[]): number {
  ret[cursor]urn arr.reduce((sum, current) => sum + current, 0);
}`,
        expected: `function addNumbers(arr: number[]): number {
  const extracted = arr.reduce((sum, current) => sum + current, 0);
  return extracted;
}`
      });
    });

    it("whole return statement selected, including semicolon", async () => {
      await shouldExtractVariable({
        code: `function addNumbers(arr: number[]): number {
  [start]return arr.reduce((sum, current) => sum + current, 0);[end]
}`,
        expected: `function addNumbers(arr: number[]): number {
  const extracted = arr.reduce((sum, current) => sum + current, 0);
  return extracted;
}`
      });
    });

    it("expression bound to a variable", async () => {
      await shouldExtractVariable({
        code: `const a = 1;
console.log(a);
console.log([start]a + 1[end]);
console.log(a + 1);`,
        expected: `const a = 1;
const extracted = a + 1;
console.log(a);
console.log(extracted);
console.log(extracted);`
      });
    });

    it("expression bound to a variable, nested in statements", async () => {
      await shouldExtractVariable({
        code: `function updateQuality() {
  for (var i = 0; i < items.length; i++) {
    if ([start]items[i][end].name != "SULFURAS") {
      items[i].sellIn = items[i].sellIn - 1;
    }
  }

  return items;
}`,
        expected: `function updateQuality() {
  for (var i = 0; i < items.length; i++) {
const extracted = items[i];
    if (extracted.name != "SULFURAS") {
      extracted.sellIn = extracted.sellIn - 1;
    }
  }

  return items;
}`
      });
    });
  });
});

async function shouldExtractVariable({
  code,
  expected
}: {
  code: Code;
  expected: Code;
}) {
  const editor = new InMemoryEditor(code);
  let result = extractVariable({
    state: "new",
    code: editor.code,
    selection: editor.selection
  });

  const responses: Array<{ id: string; type: "choice"; value: any }> = [];

  while (result.action === "ask user choice") {
    const choice = result.choices[0];

    responses.push({
      id: result.id,
      type: "choice",
      value: choice
    });

    result = extractVariable({
      state: "with user responses",
      responses,
      code: editor.code,
      selection: editor.selection
    });
  }

  if (result.action !== "read then write") {
    throw new Error(`Expected "read then write" but got "${result.action}"`);
  }

  const { code: expectedCode, selection: expectedSelection } =
    new InMemoryEditor(expected);

  const testEditor = new InMemoryEditor(editor.code);
  await testEditor.readThenWrite(
    result.readSelection,
    result.getModifications,
    result.newCursorPosition
  );

  expect(testEditor.code).toBe(expectedCode);

  if (!expectedSelection.isCursorAtTopOfDocument) {
    expect(result).toMatchObject({
      newCursorPosition: expectedSelection.start
    });
  }
}
