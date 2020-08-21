import { Code, ErrorReason } from "../../../editor/editor";
import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { testEach } from "../../../tests-helpers";

import { inlineFunction } from "./inline-function";

describe("Inline Function", () => {
  testEach<{ code: Code; expected: Code }>(
    "should inline function",
    [
      {
        description: "function with 1 call expression",
        code: `function sayHello() {
  console.log("Hello!");
}

sayHello();`,
        expected: `console.log("Hello!");`
      },
      {
        description: "only the selected function",
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
      },
      {
        description: "function with multiple call expressions",
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
      },
      {
        description: "nested functions, cursor on nested",
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
      },
      {
        description: "only call expressions in scope",
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
      },
      {
        description: "function with top-level if statement",
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
      },
      {
        description: "function with params",
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
      },
      {
        description: "function with unused params",
        code: `function sayHello(firstName, lastName) {
  console.log("Hello", firstName, lastName);
}

sayHello("Jane");`,
        expected: `console.log("Hello", "Jane", undefined);`
      },
      {
        description: "function with array pattern in params",
        code: `function doSomething([name]) {
  console.log(name);
}

doSomething(["Jane", "Doe"]);`,
        expected: `console.log("Jane");`
      },
      {
        description: "function with array pattern in params (recursive)",
        code: `function doSomething([[name]]) {
  console.log(name);
}

doSomething([["Jane"], "Doe"]);`,
        expected: `console.log("Jane");`
      },
      {
        description: "function with array pattern in params (nth element)",
        code: `function doSomething([[_, name]]) {
  console.log(name);
}

doSomething([[30, "Jane"], "Doe"]);`,
        expected: `console.log("Jane");`
      },
      {
        description: "function with object pattern in params",
        code: `function doSomething({ name }) {
  console.log(name);
}

doSomething({ name: "Jane", age: 30 });`,
        expected: `console.log("Jane");`
      },
      {
        description: "function with object pattern in params (rest element)",
        code: `function doSomething({ name, ...others }) {
  console.log(others);
}

doSomething({ name: "Jane", age: 30 });`,
        expected: `console.log({
  age: 30
});`
      },
      {
        description: "function with combination of patterns",
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
      },
      {
        description: "function with rest element in params",
        code: `function doSomething(name, ...others) {
  console.log(others);
}

doSomething("Jane", "Doe", 30);`,
        expected: `console.log(["Doe", 30]);`
      },
      {
        description: "function with rest element in params (array pattern)",
        code: `function doSomething(name, ...[lastName]) {
  console.log(lastName);
}

doSomething("Jane", "Doe", 30);`,
        expected: `console.log("Doe");`
      },
      {
        description: "function with typed params",
        code: `function doSomething(name: string) {
  console.log(name);
}

doSomething("Jane");`,
        expected: `console.log("Jane");`
      },
      {
        description: "function with assignment pattern",
        code: `function doSomething(name = "John") {
  console.log(name);
}

doSomething("Jane");`,
        expected: `console.log("Jane");`
      },
      {
        description: "function with assignment pattern (fallback on default)",
        code: `function doSomething(name, lastName = "Smith") {
  console.log(lastName);
}

doSomething("Jane");`,
        expected: `console.log("Smith");`
      },
      {
        description: "call expression with identifier",
        code: `function doSomething(name, lastName) {
  console.log(name, lastName);
}

const firstName = "Jane";
doSomething(firstName, "Smith");`,
        expected: `const firstName = "Jane";
console.log(firstName, "Smith");`
      },
      {
        description: "function assigned to a variable declaration",
        code: `function doSomething(name, lastName) {
  console.log(name, lastName);
}

const sayHi = doSomething;`,
        expected: `const sayHi = function(name, lastName) {
  console.log(name, lastName);
};`
      },
      {
        description: "limit to non-shadowed bindings",
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
      },
      {
        description: "in a variable declaration",
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
      },
      {
        description: "in a variable declaration (multiple declarations)",
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
      },
      {
        description: "in an assignment expression",
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
      },
      {
        description: "in a conditional expression",
        code: `function getFirstName() {
  return "Smith";
}

const firstName = hasName ? getFirstName() : null;`,
        expected: `const firstName = hasName ? "Smith" : null;`
      },
      {
        description: "in a call expression",
        code: `function getFirstName() {
  return "Smith";
}

console.log(getFirstName());`,
        expected: `console.log("Smith");`
      },
      {
        description: "in a return statement",
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
      },
      {
        description: "in an arrow function expression",
        code: `function sayHello(name) {
  console.log(\`Hello \${name}\`);
}

function sayHelloToJohn() {
  return () => sayHello("John");
}`,
        expected: `function sayHelloToJohn() {
  return () => console.log(\`Hello \${"John"}\`);
}`
      },
      {
        description: "function with comments",
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
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await inlineFunction(editor);

      expect(editor.code).toBe(expected);
    }
  );

  testEach<{ code: Code; expectedError: ErrorReason }>(
    "should show an error message",
    [
      {
        description: "cursor is not on a function",
        code: `const hello = "Hello"`,
        expectedError: ErrorReason.DidNotFindInlinableCode
      },
      {
        description: "cursor is not on function word or id",
        code: `function sayHello([cursor]name) {
  console.log("Hello!", name);
}

sayHello("Jane");`,
        expectedError: ErrorReason.DidNotFindInlinableCode
      },
      {
        description: "function has no reference in scope",
        code: `function limitedScope() {
  if (isValid) {
    [cursor]function doSomething(name) {
      console.log(name);
    }
  }
}

// Not in scope.
doSomething();`,
        expectedError: ErrorReason.DidNotFindInlinableCode
      },
      {
        description: "function has multiple return statements",
        code: `function getFirstName(name) {
  if (!name) return "unknown";
  return name.split(" ")[0];
}

function sayHello(name) {
  const firstName = getFirstName(name);
  console.log("Hello", firstName);
}`,
        expectedError: ErrorReason.CantInlineFunctionWithMultipleReturns
      },
      {
        description: "function has implicit return statements",
        code: `function getFirstName(name) {
  if (!name) {
    return "unknown";
  }
}

function sayHello(name) {
  const firstName = getFirstName(name);
  console.log("Hello", firstName);
}`,
        expectedError: ErrorReason.CantInlineFunctionWithMultipleReturns
      },
      {
        description:
          "function is assigned to variable but has no return statement",
        code: `function getFirstName(name) {
  console.log(name);
}

function sayHello(name) {
  const firstName = getFirstName(name);
  console.log("Hello", firstName);
}`,
        expectedError: ErrorReason.CantInlineAssignedFunctionWithoutReturn
      },
      {
        description:
          "function is assigned to expression but has no return statement",
        code: `function getFirstName(name) {
  console.log(name);
}

function sayHello(name) {
  let firstName;
  firstName = getFirstName(name);
  console.log("Hello", firstName);
}`,
        expectedError: ErrorReason.CantInlineAssignedFunctionWithoutReturn
      },
      {
        description: "function is assigned and has many statements",
        code: `function getFirstName() {
  console.log("Here's a side effect");
  return "Smith";
}

const firstName = hasName ? getFirstName() : null;`,
        expectedError: ErrorReason.CantInlineAssignedFunctionWithManyStatements
      }
    ],
    async ({ code, expectedError }) => {
      const editor = new InMemoryEditor(code);
      jest.spyOn(editor, "showError");

      await inlineFunction(editor);

      expect(editor.showError).toBeCalledWith(expectedError);
    }
  );

  describe("function is exported", () => {
    const code = `function sayHello(name) {
  console.log(name);
}

sayHello("John");

export { sayHello }`;

    it("should not remove the function", async () => {
      const editor = new InMemoryEditor(code);

      await inlineFunction(editor);

      const expectedCode = `function sayHello(name) {
  console.log(name);
}

console.log("John");

export { sayHello }`;
      expect(editor.code).toBe(expectedCode);
    });

    it("should show an error message to explain", async () => {
      const editor = new InMemoryEditor(code);
      jest.spyOn(editor, "showError");

      await inlineFunction(editor);

      expect(editor.showError).toBeCalledWith(
        ErrorReason.CantRemoveExportedFunction
      );
    });
  });
});
