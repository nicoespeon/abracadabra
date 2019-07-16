import {
  DelegateToEditor,
  EditorCommand
} from "../../editor/i-delegate-to-editor";
import { ReadThenWrite, Code, Update } from "../../editor/i-write-code";
import {
  ShowErrorMessage,
  ErrorReason
} from "../../editor/i-show-error-message";
import { Selection } from "../../editor/selection";
import { extractVariable } from "./extract-variable";
import { testEach } from "../../tests-helpers";

describe("Extract Variable", () => {
  let readThenWrite: ReadThenWrite;
  let delegateToEditor: DelegateToEditor;
  let showErrorMessage: ShowErrorMessage;
  let updates: Update[] = [];

  beforeEach(() => {
    delegateToEditor = jest.fn();
    showErrorMessage = jest.fn();
    readThenWrite = jest
      .fn()
      .mockImplementation(
        (_, getUpdates) => (updates = getUpdates('"Hello!"'))
      );
  });

  describe("basic extraction behaviour", () => {
    const code = `console.log("Hello!");`;
    const extractableSelection = new Selection([0, 12], [0, 20]);

    it("should update code with extractable selection", async () => {
      await doExtractVariable(code, extractableSelection);

      expect(readThenWrite).toBeCalledWith(
        extractableSelection,
        expect.any(Function)
      );
    });

    it("should expand selection to the nearest extractable code", async () => {
      const selectionInExtractableCode = Selection.cursorAt(0, 15);

      await doExtractVariable(code, selectionInExtractableCode);

      expect(readThenWrite).toBeCalledWith(
        extractableSelection,
        expect.any(Function)
      );
    });

    it("should update code to extract selection into a variable", async () => {
      await doExtractVariable(code, extractableSelection);

      expect(updates).toEqual([
        {
          code: `const extracted = "Hello!";\n`,
          selection: Selection.cursorAt(0, 0)
        },
        { code: "extracted", selection: extractableSelection }
      ]);
    });

    it("should rename extracted symbol", async () => {
      await doExtractVariable(code, extractableSelection);

      expect(delegateToEditor).toBeCalledTimes(1);
      expect(delegateToEditor).toBeCalledWith(EditorCommand.RenameSymbol);
    });

    it("should extract with correct indentation", async () => {
      const code = `
    function sayHello() {
      console.log("Hello!");
    }`;
      const extractableSelection = new Selection([2, 18], [2, 26]);

      await doExtractVariable(code, extractableSelection);

      expect(updates[0]).toEqual({
        code: expect.stringMatching(/"Hello!";\n {6}$/),
        selection: Selection.cursorAt(2, 6)
      });
    });

    describe("invalid selection", () => {
      const invalidSelection = new Selection([0, 10], [0, 14]);

      it("should not extract anything", async () => {
        await doExtractVariable(code, invalidSelection);

        expect(readThenWrite).not.toBeCalled();
      });

      it("should show an error message", async () => {
        await doExtractVariable(code, invalidSelection);

        expect(showErrorMessage).toBeCalledWith(
          ErrorReason.DidNotFoundExtractableCode
        );
      });
    });
  });

  // 👩‍🌾 All patterns we can extract

  testEach<{
    code: Code;
    selection: Selection;
    expected: {
      read: Selection;
      update?: Selection;
    };
  }>(
    "should extract",
    [
      {
        description: "a string",
        code: `console.log("Hello!")`,
        selection: Selection.cursorAt(0, 12),
        expected: { read: new Selection([0, 12], [0, 20]) }
      },
      {
        description: "a number",
        code: `console.log(12.5)`,
        selection: Selection.cursorAt(0, 12),
        expected: { read: new Selection([0, 12], [0, 16]) }
      },
      {
        description: "a boolean",
        code: `console.log(false)`,
        selection: Selection.cursorAt(0, 12),
        expected: { read: new Selection([0, 12], [0, 17]) }
      },
      {
        description: "null",
        code: `console.log(null)`,
        selection: Selection.cursorAt(0, 12),
        expected: { read: new Selection([0, 12], [0, 16]) }
      },
      {
        description: "undefined",
        code: `console.log(undefined)`,
        selection: Selection.cursorAt(0, 12),
        expected: { read: new Selection([0, 12], [0, 21]) }
      },
      {
        description: "an array",
        code: `console.log([1, 2, 'three', [true, null]])`,
        selection: Selection.cursorAt(0, 12),
        expected: { read: new Selection([0, 12], [0, 41]) }
      },
      {
        description: "an array (multi-lines)",
        code: `console.log([
  1,
  'Two',
  [true, null]
])`,
        selection: Selection.cursorAt(0, 12),
        expected: { read: new Selection([0, 12], [4, 1]) }
      },
      {
        description: "an object",
        code: `console.log({ one: 1, foo: true, hello: 'World!' })`,
        selection: Selection.cursorAt(0, 12),
        expected: { read: new Selection([0, 12], [0, 50]) }
      },
      {
        description: "an object (multi-lines)",
        code: `console.log({
  one: 1,
  foo: true,
  hello: 'World!'
})`,
        selection: Selection.cursorAt(0, 12),
        expected: { read: new Selection([0, 12], [4, 1]) }
      },
      {
        description: "a named function",
        code: `console.log(function sayHello() {
  return "Hello!";
})`,
        selection: Selection.cursorAt(0, 12),
        expected: { read: new Selection([0, 12], [2, 1]) }
      },
      {
        description: "an arrow function",
        code: `console.log(() => "Hello!")`,
        selection: Selection.cursorAt(0, 12),
        expected: { read: new Selection([0, 12], [0, 26]) }
      },
      {
        description: "a function call",
        code: `console.log(sayHello("World"))`,
        selection: Selection.cursorAt(0, 12),
        expected: { read: new Selection([0, 12], [0, 29]) }
      },
      {
        description: "the correct variable when we have many",
        code: `console.log("Hello");
console.log("the", "World!", "Alright.");
console.log("How are you doing?");`,
        selection: Selection.cursorAt(1, 19),
        expected: {
          read: new Selection([1, 19], [1, 27]),
          update: Selection.cursorAt(1, 0)
        }
      },
      {
        description: "a multi-lines object when cursor is inside",
        code: `console.log({
  one: 1,
  foo: true,
  hello: 'World!'
});`,
        selection: Selection.cursorAt(2, 3),
        expected: { read: new Selection([0, 12], [4, 1]) }
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
        expected: { read: new Selection([3, 9], [3, 17]) }
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
        expected: { read: new Selection([3, 9], [3, 17]) }
      },
      {
        description: "an element in a multi-lines array",
        code: `const SUPPORTED_LANGUAGES = [
  "javascript",
  "javascriptreact",
  "typescript",
  "typescriptreact"
];`,
        selection: Selection.cursorAt(2, 2),
        expected: { read: new Selection([2, 2], [2, 19]) }
      },
      {
        description: "an element nested in a multi-lines array",
        code: `console.log([
  1,
  [
    {
      hello: "Hello!"
    }
  ]
]);`,
        selection: Selection.cursorAt(4, 13),
        expected: { read: new Selection([4, 13], [4, 21]) }
      },
      {
        description: "the whole object when cursor is on its property",
        code: `console.log({ foo: "bar", one: true });`,
        selection: Selection.cursorAt(0, 16),
        expected: { read: new Selection([0, 12], [0, 37]) }
      },
      {
        description: "a computed object property",
        code: `const a = { [key]: "value" }`,
        selection: Selection.cursorAt(0, 13),
        expected: { read: new Selection([0, 13], [0, 16]) }
      },
      {
        description: "a computed object property value when cursor is on value",
        code: `const a = { [key]: "value" }`,
        selection: Selection.cursorAt(0, 19),
        expected: { read: new Selection([0, 19], [0, 26]) }
      },
      {
        description: "the whole object when cursor is on a method declaration",
        code: `console.log({
  getFoo() {
    return "bar";
  }
})`,
        selection: Selection.cursorAt(1, 2),
        expected: { read: new Selection([0, 12], [4, 1]) }
      },
      {
        description:
          "the nested object when cursor is on nested object property",
        code: `console.log({ foo: { bar: true } })`,
        selection: Selection.cursorAt(0, 21),
        expected: { read: new Selection([0, 19], [0, 32]) }
      },
      {
        description: "a spread variable",
        code: `console.log({ ...foo.bar })`,
        selection: Selection.cursorAt(0, 22),
        expected: { read: new Selection([0, 12], [0, 26]) }
      },
      {
        description: "a spread function result",
        code: `console.log({
  ...getInlinableCode(declaration),
  id: "name"
})`,
        selection: Selection.cursorAt(1, 11),
        expected: { read: new Selection([0, 12], [3, 1]) }
      },
      {
        description:
          "a valid path when cursor is on a part of member expression",
        code: `console.log(path.node.name)`,
        selection: Selection.cursorAt(0, 17),
        expected: { read: new Selection([0, 12], [0, 21]) }
      },
      {
        description: "a return value of a function",
        code: `function getMessage() {
  return "Hello!";
}`,
        selection: Selection.cursorAt(1, 9),
        expected: {
          read: new Selection([1, 9], [1, 17]),
          update: Selection.cursorAt(1, 2)
        }
      },
      {
        description: "an assigned variable",
        code: `const message = "Hello!";`,
        selection: Selection.cursorAt(0, 16),
        expected: { read: new Selection([0, 16], [0, 24]) }
      },
      {
        description: "a class property assignment",
        code: `class Logger {
  message = "Hello!";
}`,
        selection: Selection.cursorAt(1, 12),
        expected: { read: new Selection([1, 12], [1, 20]) }
      },
      {
        description: "a computed class property",
        code: `class Logger {
  [key] = "value";
}`,
        selection: Selection.cursorAt(1, 3),
        expected: { read: new Selection([1, 3], [1, 6]) }
      },
      {
        description: "an interpolated string when cursor is on a subpart of it",
        code: "console.log(`Hello ${world}! How are you doing?`)",
        selection: Selection.cursorAt(0, 15),
        expected: { read: new Selection([0, 12], [0, 48]) }
      },
      {
        description: "an if statement (whole statement)",
        code: "if (parents.length > 0 && type === 'refactor') doSomething();",
        selection: new Selection([0, 4], [0, 45]),
        expected: { read: new Selection([0, 4], [0, 45]) }
      },
      {
        description: "an if statement (part of it)",
        code: "if (parents.length > 0 && type === 'refactor') doSomething();",
        selection: new Selection([0, 4], [0, 22]),
        expected: { read: new Selection([0, 4], [0, 22]) }
      },
      {
        description: "a multi-lines if statement (whole statement)",
        code: `if (
  parents.length > 0 &&
  type === 'refactor'
) doSomething()`,
        selection: new Selection([1, 2], [2, 21]),
        expected: { read: new Selection([1, 2], [2, 21]) }
      },
      {
        description: "a multi-lines if statement (part of it)",
        code: `if (
  parents.length > 0 &&
  type === 'refactor'
) doSomething()`,
        selection: new Selection([2, 2], [2, 21]),
        expected: { read: new Selection([2, 2], [2, 21]) }
      },
      {
        description: "a while statement",
        code:
          "while (parents.length > 0 && type === 'refactor') doSomething();",
        selection: new Selection([0, 7], [0, 48]),
        expected: { read: new Selection([0, 7], [0, 48]) }
      },
      {
        description: "a case statement",
        code: `switch (text) {
  case "Hello!":
  default:
    break;
}`,
        selection: Selection.cursorAt(1, 7),
        expected: { read: new Selection([1, 7], [1, 15]) }
      },
      {
        description: "an unamed function parameter when cursor is inside",
        code: `console.log(function () {
  return "Hello!";
});`,
        selection: Selection.cursorAt(1, 0),
        expected: { read: new Selection([0, 12], [2, 1]) }
      },
      {
        description: "an exported variable declaration",
        code: `export const something = {
  foo: "bar"
};`,
        selection: Selection.cursorAt(1, 9),
        expected: { read: new Selection([1, 7], [1, 12]) }
      },
      {
        description: "an object returned from arrow function",
        code: `const something = () => ({
  foo: "bar"
});`,
        selection: Selection.cursorAt(1, 9),
        expected: { read: new Selection([1, 7], [1, 12]) }
      },
      {
        description: "a value inside an arrow function",
        code: `() => (
  console.log("Hello")
)`,
        selection: Selection.cursorAt(1, 16),
        expected: { read: new Selection([1, 14], [1, 21]) }
      },
      {
        description: "an object from a nested call expression",
        code: `assert.isTrue(
  getError({ context: ["value"] })
);`,
        selection: Selection.cursorAt(1, 15),
        expected: { read: new Selection([1, 11], [1, 33]) }
      },
      {
        description: "a multi-lines ternary",
        code: `function getText() {
  return isValid
    ? "yes"
    : "no";
}`,
        selection: Selection.cursorAt(2, 8),
        expected: {
          read: new Selection([2, 6], [2, 11]),
          update: Selection.cursorAt(1, 2)
        }
      },
      {
        description: "a multi-lines unary expression",
        code: `if (
  !(threshold > 10 || isPaused)
) {
  console.log("Ship it");
}`,
        selection: Selection.cursorAt(1, 17),
        expected: { read: new Selection([1, 16], [1, 18]) }
      },
      {
        description: "a variable in a JSX element",
        code: `function render() {
  return <div className="text-lg font-weight-bold">
    {this.props.location.name}
  </div>
}`,
        selection: Selection.cursorAt(2, 27),
        expected: {
          read: new Selection([2, 5], [2, 29]),
          update: Selection.cursorAt(1, 2)
        }
      },
      {
        description: "a JSX element (cursor on opening tag)",
        code: `function render() {
  return <div className="text-lg font-weight-bold">
    {this.props.location.name}
  </div>
}`,
        selection: Selection.cursorAt(1, 11),
        expected: {
          read: new Selection([1, 9], [3, 8]),
          update: Selection.cursorAt(1, 2)
        }
      },
      {
        description: "a JSX element (cursor on closing tag)",
        code: `function render() {
  return <div className="text-lg font-weight-bold">
    {this.props.location.name}
  </div>
}`,
        selection: Selection.cursorAt(3, 3),
        expected: {
          read: new Selection([1, 9], [3, 8]),
          update: Selection.cursorAt(1, 2)
        }
      },
      {
        description: "an error instance",
        code: `console.log(new Error("It failed"))`,
        selection: Selection.cursorAt(0, 14),
        expected: { read: new Selection([0, 12], [0, 34]) }
      },
      {
        description: "a call expression parameter (multi-lines)",
        code: `createIfStatement(
  parentPath.node.operator,
  parentPath.node.left,
  node.consequent
)`,
        selection: Selection.cursorAt(1, 20),
        expected: { read: new Selection([1, 2], [1, 26]) }
      },
      {
        description: "a conditional expression (multi-lines)",
        code: `const type = !!(
  path.node.loc.length > 0
) ? "with-loc"
  : "without-loc";`,
        selection: Selection.cursorAt(1, 17),
        expected: { read: new Selection([1, 2], [1, 22]) }
      },
      {
        description: "a value in a JSXExpressionContainer",
        code: `<Component
  text={getTextForPerson({
    name: "Pedro"
  })}
/>`,
        selection: Selection.cursorAt(2, 12),
        expected: { read: new Selection([2, 10], [2, 17]) }
      },
      {
        description: "a value in a new Expression",
        code: `new Author(
  "name"
)`,
        selection: Selection.cursorAt(1, 2),
        expected: { read: new Selection([1, 2], [1, 8]) }
      },
      {
        description: "a value in an Array argument of a function",
        code: `doSomething([
  getValueOf("name")
])`,
        selection: Selection.cursorAt(1, 2),
        expected: { read: new Selection([1, 2], [1, 20]) }
      },
      {
        description: "a new Expression in an Array argument of a function",
        code: `doSomething([
  new Author("Eliott")
])`,
        selection: Selection.cursorAt(1, 2),
        expected: { read: new Selection([1, 2], [1, 22]) }
      },
      {
        description: "a value in a binary expression",
        code: `console.log(
  currentValue >
  10
);`,
        selection: Selection.cursorAt(2, 2),
        expected: { read: new Selection([2, 2], [2, 4]) }
      }
    ],
    async ({ code, selection, expected }) => {
      await doExtractVariable(code, selection);

      expect(readThenWrite).toBeCalledWith(expected.read, expect.any(Function));

      const expectedUpdateSelection =
        expected.update || Selection.cursorAt(0, 0);
      expect(updates[0].selection).toStrictEqual(expectedUpdateSelection);
    }
  );

  it("should wrap extracted JSX element inside JSX Expression Container when inside another", async () => {
    const code = `function render() {
  return <div className="text-lg font-weight-bold">
    <p>{name}</p>
  </div>
}`;
    const selection = Selection.cursorAt(2, 4);
    readThenWrite = jest
      .fn()
      .mockImplementation(
        (_, getUpdates) => (updates = getUpdates("<p>{name}</p>"))
      );

    await doExtractVariable(code, selection);

    expect(updates[1].code).toBe("{extracted}");
  });

  it("should not wrap extracted JSX element inside JSX Expression Container when not inside another", async () => {
    const code = `function render() {
  return <p>{name}</p>;
}`;
    const selection = Selection.cursorAt(1, 9);
    readThenWrite = jest
      .fn()
      .mockImplementation(
        (_, getUpdates) => (updates = getUpdates("<p>{name}</p>"))
      );

    await doExtractVariable(code, selection);

    expect(updates[1].code).toBe("extracted");
  });

  // ✋ Patterns that can't be extracted

  testEach<{ code: Code; selection: Selection }>(
    "should not extract",
    [
      {
        description: "a function declaration",
        code: `function sayHello() {
  console.log("hello");
}`,
        selection: new Selection([0, 0], [2, 1])
      },
      {
        description: "a class property identifier",
        code: `class Logger {
  message = "Hello!";
}`,
        selection: new Selection([1, 2], [1, 9])
      },
      {
        description: "the identifier from a variable declaration",
        code: `const foo = "bar";`,
        selection: new Selection([0, 6], [0, 9])
      }
    ],
    async ({ code, selection }) => {
      await doExtractVariable(code, selection);

      expect(readThenWrite).not.toBeCalled();
    }
  );

  function doExtractVariable(code: Code, selection: Selection) {
    return extractVariable(
      code,
      selection,
      readThenWrite,
      delegateToEditor,
      showErrorMessage
    );
  }
});
