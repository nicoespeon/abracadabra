import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { Code } from "../../../editor/editor";
import { inlineFunction } from "./inline-function";

describe("Inline Function", () => {
  describe("should inline function", () => {
    it("function with 1 call expression", async () => {
      await shouldInlineFunction({
        code: `function sayHello() {
  console.log("Hello!");
}

sayHello();`,
        expected: `console.log("Hello!");`
      });
    });

    it("only the selected function", async () => {
      await shouldInlineFunction({
        code: `function sayHello() {
  console.log("Hello!");
}

function sayHi() {
  console.log("Hi!");
}

sayHello();
sayHi();`,
        expected: `function sayHi() {
  console.log("Hi!");
}

console.log("Hello!");
sayHi();`
      });
    });

    it("function with multiple call expressions", async () => {
      await shouldInlineFunction({
        code: `function sayHello() {
  console.log("Hello!");
}

function sayHelloToJane() {
  sayHello();
  console.log("Jane");
}

sayHello();`,
        expected: `function sayHelloToJane() {
  console.log("Hello!");
  console.log("Jane");
}

console.log("Hello!");`
      });
    });

    it("nested functions, cursor on nested", async () => {
      await shouldInlineFunction({
        code: `function doSomething() {
  function say[cursor]Hello() {
    console.log("Hello!");
  }

  sayHello();
}

doSomething();`,
        expected: `function doSomething() {
  console.log("Hello!");
}

doSomething();`
      });
    });

    it("only call expressions in scope", async () => {
      await shouldInlineFunction({
        code: `function doSomething() {
  if (isValid) {
    logger("is valid");

    [cursor]function sayHello() {
      console.log("Hello!");
    }
  }

  sayHello();
}

function sayHelloToJane() {
  sayHello();
  console.log("Jane");
}`,
        expected: `function doSomething() {
  if (isValid) {
    logger("is valid");
  }

  console.log("Hello!");
}

function sayHelloToJane() {
  sayHello();
  console.log("Jane");
}`
      });
    });

    it("function with top-level if statement", async () => {
      await shouldInlineFunction({
        code: `let isMorning = true;

[cursor]function sayHello() {
  if (isMorning) {
    console.log("Good morning.");
  } else {
    console.log("Hello World!");
  }
}

sayHello();`,
        expected: `let isMorning = true;

if (isMorning) {
  console.log("Good morning.");
} else {
  console.log("Hello World!");
}`
      });
    });

    it("function with params", async () => {
      await shouldInlineFunction({
        code: `function sayHello(firstName, lastName, isMorning) {
  if (isMorning) {
    console.log("Good morning ", firstName);
  } else {
    console.log(\`Hello \${firstName}, \${lastName}!\`);
  }
}

sayHello("Jane", "Doe", false);
sayHello("John", "Smith", true);`,
        expected: `if (false) {
  console.log("Good morning ", "Jane");
} else {
  console.log(\`Hello \${"Jane"}, \${"Doe"}!\`);
}
if (true) {
  console.log("Good morning ", "John");
} else {
  console.log(\`Hello \${"John"}, \${"Smith"}!\`);
}`
      });
    });

    it("function with unused params", async () => {
      await shouldInlineFunction({
        code: `function sayHello(firstName, lastName) {
  console.log("Hello", firstName, lastName);
}

sayHello("Jane");`,
        expected: `console.log("Hello", "Jane", undefined);`
      });
    });

    it("function with array pattern in params", async () => {
      await shouldInlineFunction({
        code: `function doSomething([name]) {
  console.log(name);
}

doSomething(["Jane", "Doe"]);`,
        expected: `console.log("Jane");`
      });
    });

    it("function with array pattern in params (recursive)", async () => {
      await shouldInlineFunction({
        code: `function doSomething([[name]]) {
  console.log(name);
}

doSomething([["Jane"], "Doe"]);`,
        expected: `console.log("Jane");`
      });
    });

    it("function with array pattern in params (nth element)", async () => {
      await shouldInlineFunction({
        code: `function doSomething([[_, name]]) {
  console.log(name);
}

doSomething([[30, "Jane"], "Doe"]);`,
        expected: `console.log("Jane");`
      });
    });

    it("function with object pattern in params", async () => {
      await shouldInlineFunction({
        code: `function doSomething({ name }) {
  console.log(name);
}

doSomething({ name: "Jane", age: 30 });`,
        expected: `console.log("Jane");`
      });
    });

    it("function with object pattern in params (rest element)", async () => {
      await shouldInlineFunction({
        code: `function doSomething({ name, ...others }) {
  console.log(others);
}

doSomething({ name: "Jane", age: 30 });`,
        expected: `console.log({
  age: 30
});`
      });
    });

    it("function with combination of patterns", async () => {
      await shouldInlineFunction({
        code: `function doSomething(name, { identities: [ { lastName } ] }) {
  console.log(lastName);
}

doSomething("Jane", {
  identities: [
    { lastName: "Doe", age: 30 },
    { lastName: "Smith", age: 17 }
  ]
});`,
        expected: `console.log("Doe");`
      });
    });

    it("function with rest element in params", async () => {
      await shouldInlineFunction({
        code: `function doSomething(name, ...others) {
  console.log(others);
}

doSomething("Jane", "Doe", 30);`,
        expected: `console.log(["Doe", 30]);`
      });
    });

    it("function with rest element in params (array pattern)", async () => {
      await shouldInlineFunction({
        code: `function doSomething(name, ...[lastName]) {
  console.log(lastName);
}

doSomething("Jane", "Doe", 30);`,
        expected: `console.log("Doe");`
      });
    });

    it("function with typed params", async () => {
      await shouldInlineFunction({
        code: `function doSomething(name: string) {
  console.log(name);
}

doSomething("Jane");`,
        expected: `console.log("Jane");`
      });
    });

    it("function with assignment pattern", async () => {
      await shouldInlineFunction({
        code: `function doSomething(name = "John") {
  console.log(name);
}

doSomething("Jane");`,
        expected: `console.log("Jane");`
      });
    });

    it("function with assignment pattern (fallback on default)", async () => {
      await shouldInlineFunction({
        code: `function doSomething(name, lastName = "Smith") {
  console.log(lastName);
}

doSomething("Jane");`,
        expected: `console.log("Smith");`
      });
    });

    it("call expression with identifier", async () => {
      await shouldInlineFunction({
        code: `function doSomething(name, lastName) {
  console.log(name, lastName);
}

const firstName = "Jane";
doSomething(firstName, "Smith");`,
        expected: `const firstName = "Jane";
console.log(firstName, "Smith");`
      });
    });

    it("function assigned to a variable declaration", async () => {
      await shouldInlineFunction({
        code: `function doSomething(name, lastName) {
  console.log(name, lastName);
}

const sayHi = doSomething;`,
        expected: `const sayHi = function(name, lastName) {
  console.log(name, lastName);
};`
      });
    });

    it("limit to non-shadowed bindings", async () => {
      await shouldInlineFunction({
        code: `function doSomething(name) {
  console.log(name);
}

doSomething("John");

function doAnotherThing() {
  const doSomething = function(name) {
    logger(name);
  };

  doSomething("Jane");
}`,
        expected: `console.log("John");

function doAnotherThing() {
  const doSomething = function(name) {
    logger(name);
  };

  doSomething("Jane");
}`
      });
    });

    it("in a variable declaration", async () => {
      await shouldInlineFunction({
        code: `function getFirstName(name) {
  return name.split(" ")[0];
}

function sayHello(name) {
  const firstName = getFirstName(name);
  console.log("Hello", firstName);
}`,
        expected: `function sayHello(name) {
  const firstName = name.split(" ")[0];
  console.log("Hello", firstName);
}`
      });
    });

    it("in a variable declaration (multiple declarations)", async () => {
      await shouldInlineFunction({
        code: `function getFirstName(name) {
  return name.split(" ")[0];
}

function sayHello(name) {
  const a = 1, firstName = getFirstName(name);
  console.log("Hello", firstName);
}`,
        expected: `function sayHello(name) {
  const a = 1, firstName = name.split(" ")[0];
  console.log("Hello", firstName);
}`
      });
    });

    it("in an assignment expression", async () => {
      await shouldInlineFunction({
        code: `function getFirstName(name) {
  return name.split(" ")[0];
}

function sayHello(name) {
  let firstName;
  firstName = getFirstName(name);
  console.log("Hello", firstName);
}`,
        expected: `function sayHello(name) {
  let firstName;
  firstName = name.split(" ")[0];
  console.log("Hello", firstName);
}`
      });
    });

    it("in a conditional expression", async () => {
      await shouldInlineFunction({
        code: `function getFirstName() {
  return "Smith";
}

const firstName = hasName ? getFirstName() : null;`,
        expected: `const firstName = hasName ? "Smith" : null;`
      });
    });

    it("in a call expression", async () => {
      await shouldInlineFunction({
        code: `function getFirstName() {
  return "Smith";
}

console.log(getFirstName());`,
        expected: `console.log("Smith");`
      });
    });

    it("in a return statement", async () => {
      await shouldInlineFunction({
        code: `function sayHello() {
  console.log("Hello");
}

function createSayHello() {
  return sayHello;
}`,
        expected: `function createSayHello() {
  return function() {
    console.log("Hello");
  };
}`
      });
    });

    it("in an arrow function expression", async () => {
      await shouldInlineFunction({
        code: `function sayHello(name) {
  console.log(\`Hello \${name}\`);
}

function sayHelloToJohn() {
  return () => sayHello("John");
}`,
        expected: `function sayHelloToJohn() {
  return () => console.log(\`Hello \${"John"}\`);
}`
      });
    });

    it("function with comments", async () => {
      await shouldInlineFunction({
        code: `function sayHello() {
  // Say hello to the user.
  console.log("Hello!");

  if (isCorrect) {
    // Do something clever.
    doSomething();
  }

  /**
   * Log some data
   */
  logData(); // => logged
}

sayHello();`,
        expected: `// Say hello to the user.
console.log("Hello!");

if (isCorrect) {
  // Do something clever.
  doSomething();
}

/**
 * Log some data
 */
logData(); // => logged`
      });
    });

    it("call expression is returned by another function", async () => {
      await shouldInlineFunction({
        code: `function [cursor]foo(x) { return (x * 2) + x + 3; }
function bar(x) { return foo(x) + 10; }`,
        expected: `function bar(x) { return (x * 2) + x + 3 + 10; }`
      });
    });

    it("async function", async () => {
      await shouldInlineFunction({
        code: `async function callerAsync() {
  await smallFunctionAsync();
}

async function [cursor]smallFunctionAsync() {
  await someOtherDelegate();
}`,
        expected: `async function callerAsync() {
  await someOtherDelegate();
}`
      });
    });

    it("function with param set to an object attribute with the same name", async () => {
      await shouldInlineFunction({
        code: `async function [cursor]someFunction(foo) {
  console.log({ foo: foo })
}

function anotherFunction() {
  someFunction({
    data: 123
  })
}`,
        expected: `function anotherFunction() {
  console.log({
    foo: {
      data: 123
    }
  });
}`
      });
    });

    it("function with param being a member expression", async () => {
      await shouldInlineFunction({
        code: `export function callingFunction() {
  const args = { foo: "bar" };
  myFunction(args.foo);
}

function [cursor]myFunction(foo: string) {
  const logger = createLogger();
  logger.log("a", "b", {
    foo: foo
  });
}`,
        expected: `export function callingFunction() {
  const args = { foo: "bar" };
  const logger = createLogger();
  logger.log("a", "b", {
    foo: args.foo
  });
}`
      });
    });
  });

  describe("should show an error message", () => {
    it("cursor is not on a function", () => {
      shouldNotInlineFunction({
        code: `const hello = "Hello"`,
        expectedError: "a function to inline"
      });
    });

    it("cursor is not on function word or id", () => {
      shouldNotInlineFunction({
        code: `function sayHello([cursor]name) {
  console.log("Hello!", name);
}

sayHello("Jane");`,
        expectedError: "a function to inline"
      });
    });

    it("function has no reference in scope", () => {
      shouldNotInlineFunction({
        code: `function limitedScope() {
  if (isValid) {
    [cursor]function doSomething(name) {
      console.log(name);
    }
  }
}

// Not in scope.
doSomething();`,
        expectedError: "a function to inline"
      });
    });

    it("function has multiple return statements", () => {
      shouldNotInlineFunction({
        code: `function getFirstName(name) {
  if (!name) return "unknown";
  return name.split(" ")[0];
}

function sayHello(name) {
  const firstName = getFirstName(name);
  console.log("Hello", firstName);
}`,
        expectedError: "inline a function with multiple returns"
      });
    });

    it("function has implicit return statements", () => {
      shouldNotInlineFunction({
        code: `function getFirstName(name) {
  if (!name) {
    return "unknown";
  }
}

function sayHello(name) {
  const firstName = getFirstName(name);
  console.log("Hello", firstName);
}`,
        expectedError: "inline a function with multiple returns"
      });
    });

    it("function is assigned to variable but has no return statement", () => {
      shouldNotInlineFunction({
        code: `function getFirstName(name) {
  console.log(name);
}

function sayHello(name) {
  const firstName = getFirstName(name);
  console.log("Hello", firstName);
}`,
        expectedError: "inline an assigned function without return"
      });
    });

    it("function is assigned to expression but has no return statement", () => {
      shouldNotInlineFunction({
        code: `function getFirstName(name) {
  console.log(name);
}

function sayHello(name) {
  let firstName;
  firstName = getFirstName(name);
  console.log("Hello", firstName);
}`,
        expectedError: "inline an assigned function without return"
      });
    });

    it("function is assigned and has many statements", () => {
      shouldNotInlineFunction({
        code: `function getFirstName() {
  console.log("Here's a side effect");
  return "Smith";
}

const firstName = hasName ? getFirstName() : null;`,
        expectedError: "inline an assigned function with many statements"
      });
    });
  });

  it("should not remove the function if exported and show an error message along the update", async () => {
    const editor = new InMemoryEditor(`function sayHello(name) {
  console.log(name);
}

sayHello("John");

export { sayHello }`);
    const result = inlineFunction({
      state: "new",
      code: editor.code,
      selection: editor.selection,
      highlightSources: []
    });

    expect(result).toMatchObject({
      action: "write",
      code: `function sayHello(name) {
  console.log(name);
}

console.log("John");

export { sayHello }`,
      errorMessage: "I'm sorry, I can't remove an exported function."
    });
  });
});

async function shouldInlineFunction({
  code,
  expected
}: {
  code: Code;
  expected: Code;
}) {
  const editor = new InMemoryEditor(code);
  const result = inlineFunction({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });

  if (result.action !== "write") {
    throw new Error(`Expected "write" but got "${result.action}"`);
  }

  expect(result.code).toBe(expected);
}

function shouldNotInlineFunction({
  code,
  expectedError
}: {
  code: Code;
  expectedError: string;
}) {
  const editor = new InMemoryEditor(code);
  const result = inlineFunction({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });

  if (result.action !== "show error") {
    throw new Error(`Expected "show error" but got "${result.action}"`);
  }

  expect(result.reason).toContain(expectedError);
}
