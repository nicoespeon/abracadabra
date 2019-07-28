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

describe.only("Inline Function", () => {
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
        selection: Selection.cursorAt(1, 2),
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
        selection: Selection.cursorAt(5, 0),
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

  async function doInlineFunction(
    code: Code,
    selection: Selection
  ): Promise<{ code: Code; position: Position }> {
    const [write, getState] = createWriteInMemory(code);
    await inlineFunction(code, selection, write, showErrorMessage);
    return getState();
  }
});
