import { Code } from "../../editor/i-write-code";
import { Selection } from "../../editor/selection";
import { Position } from "../../editor/position";
import {
  ShowErrorMessage,
  ErrorReason
} from "../../editor/i-show-error-message";
import { createWriteInMemory } from "../../editor/adapters/write-code-in-memory";
import { inlineFunction } from "./inline-function";
import { testEach } from "../../tests-helpers";

describe("Inline Function", () => {
  let showErrorMessage: ShowErrorMessage;

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; selection?: Selection; expected: Code }>(
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
  function sayHello() {
    console.log("Hello!");
  }

  sayHello();
}

doSomething();`,
        selection: Selection.cursorAt(1, 14),
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

    function sayHello() {
      console.log("Hello!");
    }
  }

  sayHello();
}

function sayHelloToJane() {
  sayHello();
  console.log("Jane");
}`,
        selection: Selection.cursorAt(4, 4),
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

function sayHello() {
  if (isMorning) {
    console.log("Good morning.");
  } else {
    console.log("Hello World!");
  }
}

sayHello();`,
        selection: Selection.cursorAt(2, 0),
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
        description: "function inlined in a variable declaration",
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
        description:
          "function inlined in a variable declaration (multiple declarations)",
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
        description: "function inlined in an assignment expression",
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
      }
    ],
    async ({ code, selection = Selection.cursorAt(0, 0), expected }) => {
      const result = await doInlineFunction(code, selection);

      expect(result.code).toBe(expected);
    }
  );

  it("should show an error message if cursor is not on a function", async () => {
    const code = `const hello = "Hello"`;
    const invalidSelection = Selection.cursorAt(2, 0);

    await doInlineFunction(code, invalidSelection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundInlinableCode
    );
  });

  it("should show an error message if cursor is not on function word or ID", async () => {
    const code = `function sayHello(name) {
  console.log("Hello!", name);
}

sayHello("Jane");`;
    const invalidSelection = Selection.cursorAt(0, 18);

    await doInlineFunction(code, invalidSelection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundInlinableCode
    );
  });

  it("should show an error message if function has no reference in scope", async () => {
    const code = `function limitedScope() {
  if (isValid) {
    function doSomething(name) {
      console.log(name);
    }
  }
}

// Not in scope.
doSomething();`;
    const selection = Selection.cursorAt(2, 4);

    await doInlineFunction(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundInlinableCode
    );
  });

  it("should show an error message if function has multiple return statements", async () => {
    const code = `function getFirstName(name) {
  if (!name) return "unknown";
  return name.split(" ")[0];
}

function sayHello(name) {
  const firstName = getFirstName(name);
  console.log("Hello", firstName);
}`;
    const selection = Selection.cursorAt(0, 0);

    await doInlineFunction(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.CantInlineFunctionWithMultipleReturns
    );
  });

  it("should show an error message if function has implicit return statements", async () => {
    const code = `function getFirstName(name) {
  if (!name) {
    return "unknown";
  }
}

function sayHello(name) {
  const firstName = getFirstName(name);
  console.log("Hello", firstName);
}`;
    const selection = Selection.cursorAt(0, 0);

    await doInlineFunction(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.CantInlineFunctionWithMultipleReturns
    );
  });

  it("should show an error message if function is assigned to variable but has no return statement", async () => {
    const code = `function getFirstName(name) {
  console.log(name);
}

function sayHello(name) {
  const firstName = getFirstName(name);
  console.log("Hello", firstName);
}`;
    const selection = Selection.cursorAt(0, 0);

    await doInlineFunction(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.CantInlineAssignedFunctionWithoutReturn
    );
  });

  it("should show an error message if function is assigned to expression but has no return statement", async () => {
    const code = `function getFirstName(name) {
  console.log(name);
}

function sayHello(name) {
  let firstName;
  firstName = getFirstName(name);
  console.log("Hello", firstName);
}`;
    const selection = Selection.cursorAt(0, 0);

    await doInlineFunction(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.CantInlineAssignedFunctionWithoutReturn
    );
  });

  describe("function is exported", () => {
    const code = `function sayHello(name) {
  console.log(name);
}

sayHello("John");

export { sayHello }`;
    const selection = Selection.cursorAt(0, 0);

    it("should not remove the function", async () => {
      const result = await doInlineFunction(code, selection);

      const expectedCode = `function sayHello(name) {
  console.log(name);
}

console.log("John");

export { sayHello }`;
      expect(result.code).toBe(expectedCode);
    });

    it("should show an error message to explain", async () => {
      await doInlineFunction(code, selection);

      expect(showErrorMessage).toBeCalledWith(
        ErrorReason.CantRemoveExportedFunction
      );
    });
  });

  async function doInlineFunction(
    code: Code,
    selection: Selection
  ): Promise<{ code: Code; position: Position }> {
    const [write, getState] = createWriteInMemory(code);
    await inlineFunction(code, selection, write, showErrorMessage);
    return getState();
  }
});
