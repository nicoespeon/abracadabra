import { Code } from "../../../editor/editor";
import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { testEach } from "../../../tests-helpers";

import { extractVariable } from "./extract-variable";

describe("Extract Variable - Patterns we can extract", () => {
  testEach<{
    code: Code;
    expected: Code;
  }>(
    "should extract",
    [
      {
        description: "a number",
        code: `console.log([cursor]12.5);`,
        expected: `const extracted = 12.5;
console.log(extracted);`
      },
      {
        description: "a boolean",
        code: `console.log([cursor]false);`,
        expected: `const extracted = false;
console.log(extracted);`
      },
      {
        description: "null",
        code: `console.log([cursor]null);`,
        expected: `const extracted = null;
console.log(extracted);`
      },
      {
        description: "undefined",
        code: `console.log([cursor]undefined);`,
        expected: `const extracted = undefined;
console.log(extracted);`
      },
      {
        description: "an array",
        code: `console.log([cursor][1, 2, 'three', [true, null]]);`,
        expected: `const extracted = [1, 2, 'three', [true, null]];
console.log(extracted);`
      },
      {
        description: "an array (multi-lines)",
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
      },
      {
        description: "a named function",
        code: `console.log([cursor]function sayHello() {
  return "Hello!";
});`,
        expected: `const extracted = function sayHello() {
  return "Hello!";
};
console.log(extracted);`
      },
      {
        description: "an arrow function",
        code: `console.log([cursor]() => "Hello!");`,
        expected: `const extracted = () => "Hello!";
console.log(extracted);`
      },
      {
        description: "a function call",
        code: `console.log([cursor]sayHello("World"));`,
        expected: `const extracted = sayHello("World");
console.log(extracted);`
      },
      {
        description: "the correct variable when we have many",
        code: `console.log("Hello");
console.log("the", [cursor]"World!", "Alright.");
console.log("How are you doing?");`,
        expected: `console.log("Hello");
const world = "World!";
console.log("the", world, "Alright.");
console.log("How are you doing?");`
      },
      {
        description: "an element in a multi-lines array",
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
      },
      {
        description: "an element nested in a multi-lines array",
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
      },
      {
        description: "a spread variable",
        code: `console.log({ ...foo.b[cursor]ar });`,
        expected: `const { bar } = foo;
console.log({ ...bar });`
      },
      {
        description: "a spread variable, cursor on spread",
        code: `console.log({ ..[cursor].foo.bar });`,
        expected: `const extracted = { ...foo.bar };
console.log(extracted);`
      },
      {
        description: "a spread function result",
        code: `console.log({
  ...getInl[cursor]inableCode(declaration),
  id: "name"
});`,
        expected: `const extracted = getInlinableCode(declaration);
console.log({
  ...extracted,
  id: "name"
});`
      },
      {
        description:
          "a valid path when cursor is on a part of member expression",
        code: `console.log(path.[cursor]node.name);`,
        expected: `const { node } = path;
console.log(node.name);`
      },
      {
        description:
          "a valid path when cursor is on the first parent of the member expression",
        code: `console.log([cursor]path.node.name);`,
        expected: `const extracted = path;
console.log(extracted.node.name);`
      },
      {
        description:
          "a member expression when property name is not in camel case",
        code: `console.log(path.[cursor]some_node.name);`,
        expected: `const { some_node } = path;
console.log(some_node.name);`
      },
      {
        description: "a member expression when property name is too long",
        code: `console.log(path.[cursor]somethingVeryVeryVeryLongThatWontFit.name);`,
        expected: `const { somethingVeryVeryVeryLongThatWontFit } = path;
console.log(somethingVeryVeryVeryLongThatWontFit.name);`
      },
      {
        description: "member expression with computed value",
        code: `console.log(this.items[[cursor]i].name);`,
        expected: `const extracted = this.items[i];
console.log(extracted.name);`
      },
      {
        description: "a return value of a function",
        code: `function getMessage() {
  return [cursor]"Hello!";
}`,
        expected: `function getMessage() {
  const hello = "Hello!";
  return hello;
}`
      },
      {
        description: "an assigned variable",
        code: `const message = [cursor]"Hello!";`,
        expected: `const hello = "Hello!";
const message = hello;`
      },
      {
        description: "a class property assignment",
        code: `class Logger {
  message = [cursor]"Hello!";
}`,
        expected: `const hello = "Hello!";
class Logger {
  message = hello;
}`
      },
      {
        description: "a computed class property",
        code: `class Logger {
  [[cursor]key] = "value";
}`,
        expected: `const extracted = key;
class Logger {
  [extracted] = "value";
}`
      },
      {
        description: "an if statement (whole statement)",
        code:
          "if ([start]parents.length > 0 && type === 'refactor'[end]) doSomething();",
        expected: `const extracted = parents.length > 0 && type === 'refactor';
if (extracted) doSomething();`
      },
      {
        description: "an if statement (part of it)",
        code:
          "if ([start]parents.length > 0[end] && type === 'refactor') doSomething();",
        expected: `const extracted = parents.length > 0;
if (extracted && type === 'refactor') doSomething();`
      },
      {
        description: "a multi-lines if statement (whole statement)",
        code: `if (
  [start]parents.length > 0 &&
  type === 'refactor'[end]
) doSomething();`,
        expected: `const extracted = parents.length > 0 &&
  type === 'refactor';
if (
  extracted
) doSomething();`
      },
      {
        description: "a multi-lines if statement (part of it)",
        code: `if (
  parents.length > 0 &&
  [start]type === 'refactor'[end]
) doSomething();`,
        expected: `const extracted = type === 'refactor';
if (
  parents.length > 0 &&
  extracted
) doSomething();`
      },
      {
        description: "if statement, cursor on else clause",
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
      },
      {
        description: "a while statement",
        code:
          "while ([start]parents.length > 0 && type === 'refactor'[end]) doSomething();",
        expected: `const extracted = parents.length > 0 && type === 'refactor';
while (extracted) doSomething();`
      },
      {
        description: "a case statement",
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
      },
      {
        description: "an unamed function parameter when cursor is inside",
        code: `console.log(function () {
[cursor]  return "Hello!";
});`,
        expected: `const extracted = function () {
  return "Hello!";
};
console.log(extracted);`
      },
      {
        description: "an exported variable declaration",
        code: `export const something = {
  foo: "b[cursor]ar"
};`,
        expected: `const foo = "bar";
export const something = {
  foo
};`
      },
      {
        description: "a default export",
        code: `export default "s[cursor]omething";`,
        expected: `const something = "something";
export default something;`
      },
      {
        description: "a default export (without trailing semicolon)",
        code: `export default "s[cursor]omething"`,
        expected: `const something = "something";
export default something`
      },
      {
        description: "a default export (with spaces after semicolon)",
        code: `export default "s[cursor]omething";   `,
        expected: `const something = "something";
export default something;   `
      },
      {
        description: "a default export (with comment after semicolon)",
        code: `export default "s[cursor]omething"; // Do something`,
        expected: `const something = "something";
export default something; // Do something`
      },
      {
        description: "a default export (multiple lines)",
        code: `export default {[cursor]
  tryTo: "extract me"
};`,
        expected: `const extracted = {
  tryTo: "extract me"
};
export default extracted;`
      },
      {
        description:
          "a default export (with statement after that has no semicolon)",
        code: `export default "[cursor]something";
console.log("done")`,
        expected: `const something = "something";
export default something;
console.log("done")`
      },
      {
        description: "a value inside an arrow function",
        code: `() => (
  console.log("H[cursor]ello")
)`,
        expected: `const hello = "Hello";
() => (
  console.log(hello)
)`
      },
      {
        description: "a multi-lines ternary",
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
      },
      {
        description: "a multi-lines unary expression",
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
      },
      {
        description: "a class instantiation (cursor on new expression)",
        code: `console.log([cursor]new Card("jack"));`,
        expected: `const extracted = new Card("jack");
console.log(extracted);`
      },
      {
        description: "a class instantiation (cursor on class identifier)",
        code: `console.log(new [cursor]Card("jack"));`,
        expected: `const extracted = new Card("jack");
console.log(extracted);`
      },
      {
        description: "a thrown error",
        code: `throw new Er[cursor]ror("It failed");`,
        expected: `const extracted = new Error("It failed");
throw extracted;`
      },
      {
        description: "a call expression parameter (multi-lines)",
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
      },
      {
        description: "a conditional expression (multi-lines)",
        code: `const type = !!(
  path.node.loc.l[cursor]ength > 0
) ? "with-loc"
  : "without-loc";`,
        expected: `const { length } = path.node.loc;
const type = !!(
  length > 0
) ? "with-loc"
  : "without-loc";`
      },
      {
        description: "a value in a new Expression",
        code: `new Author(
  [cursor]"name"
);`,
        expected: `const name = "name";
new Author(
  name
);`
      },
      {
        description: "a value in an Array argument of a function",
        code: `doSomething([
  [cursor]getValueOf("name")
]);`,
        expected: `const extracted = getValueOf("name");
doSomething([
  extracted
]);`
      },
      {
        description: "a new Expression in an Array argument of a function",
        code: `doSomething([
  [cursor]new Author("Eliott")
]);`,
        expected: `const extracted = new Author("Eliott");
doSomething([
  extracted
]);`
      },
      {
        description: "a value in a binary expression",
        code: `console.log(
  currentValue >
  [cursor]10
);`,
        expected: `const extracted = 10;
console.log(
  currentValue >
  extracted
);`
      },
      {
        description: "an arrow function (cursor on params)",
        code: `const sayHello = (na[cursor]me) => {
  console.log(name);
};`,
        expected: `const extracted = (name) => {
  console.log(name);
};
const sayHello = extracted;`
      },
      {
        description: "a for statement",
        code: `for (var i = 0; i < this.it[cursor]ems.length; i++) {}`,
        expected: `const { items } = this;
for (var i = 0; i < items.length; i++) {}`
      },
      {
        description: "with tabs",
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
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await extractVariable(editor);

      expect(editor.code).toBe(expected);
    }
  );
});
