import {
  DelegateToEditor,
  EditorCommand
} from "../../editor/i-delegate-to-editor";
import { Code } from "../../editor/i-write-code";
import { Selection } from "../../editor/selection";
import { createReadThenWriteInMemory } from "../../editor/adapters/write-code-in-memory";
import {
  ShowErrorMessage,
  ErrorReason
} from "../../editor/i-show-error-message";
import { extractVariable } from "./extract-variable";
import { testEach } from "../../tests-helpers";

describe("Extract Variable", () => {
  let delegateToEditor: DelegateToEditor;
  let showErrorMessage: ShowErrorMessage;

  beforeEach(() => {
    delegateToEditor = jest.fn();
    showErrorMessage = jest.fn();
  });

  describe("basic extraction behaviour", () => {
    const code = `console.log("Hello!");`;
    const extractableSelection = new Selection([0, 12], [0, 20]);

    it("should update code with extractable selection", async () => {
      const result = await doExtractVariable(code, extractableSelection);

      expect(result).toBe(`const extracted = "Hello!";
console.log(extracted);`);
    });

    it("should expand selection to the nearest extractable code", async () => {
      const selectionInExtractableCode = Selection.cursorAt(0, 15);

      const result = await doExtractVariable(code, selectionInExtractableCode);

      expect(result).toBe(`const extracted = "Hello!";
console.log(extracted);`);
    });

    it("should rename extracted symbol", async () => {
      await doExtractVariable(code, extractableSelection);

      expect(delegateToEditor).toBeCalledTimes(1);
      expect(delegateToEditor).toBeCalledWith(EditorCommand.RenameSymbol);
    });

    it("should extract with correct indentation", async () => {
      const code = `    function sayHello() {
      console.log("Hello!");
    }`;
      const extractableSelection = new Selection([1, 18], [1, 26]);

      const result = await doExtractVariable(code, extractableSelection);

      expect(result).toBe(`    function sayHello() {
      const extracted = "Hello!";
      console.log(extracted);
    }`);
    });

    describe("invalid selection", () => {
      const invalidSelection = new Selection([0, 10], [0, 14]);

      it("should not extract anything", async () => {
        const result = await doExtractVariable(code, invalidSelection);

        expect(result).toBe(code);
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
    expected?: Code;
  }>(
    "should extract",
    [
      {
        description: "a string",
        code: `console.log("Hello!");`,
        selection: Selection.cursorAt(0, 12),
        expected: `const extracted = "Hello!";
console.log(extracted);`
      },
      {
        description: "a number",
        code: `console.log(12.5);`,
        selection: Selection.cursorAt(0, 12),
        expected: `const extracted = 12.5;
console.log(extracted);`
      },
      {
        description: "a boolean",
        code: `console.log(false);`,
        selection: Selection.cursorAt(0, 12),
        expected: `const extracted = false;
console.log(extracted);`
      },
      {
        description: "null",
        code: `console.log(null);`,
        selection: Selection.cursorAt(0, 12),
        expected: `const extracted = null;
console.log(extracted);`
      },
      {
        description: "undefined",
        code: `console.log(undefined);`,
        selection: Selection.cursorAt(0, 12),
        expected: `const extracted = undefined;
console.log(extracted);`
      },
      {
        description: "an array",
        code: `console.log([1, 2, 'three', [true, null]]);`,
        selection: Selection.cursorAt(0, 12),
        expected: `const extracted = [1, 2, 'three', [true, null]];
console.log(extracted);`
      },
      {
        description: "an array (multi-lines)",
        code: `console.log([
  1,
  'Two',
  [true, null]
]);`,
        selection: Selection.cursorAt(0, 12),
        expected: `const extracted = [
  1,
  'Two',
  [true, null]
];
console.log(extracted);`
      },
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
        description: "a named function",
        code: `console.log(function sayHello() {
  return "Hello!";
});`,
        selection: Selection.cursorAt(0, 12),
        expected: `const extracted = function sayHello() {
  return "Hello!";
};
console.log(extracted);`
      },
      {
        description: "an arrow function",
        code: `console.log(() => "Hello!");`,
        selection: Selection.cursorAt(0, 12),
        expected: `const extracted = () => "Hello!";
console.log(extracted);`
      },
      {
        description: "a function call",
        code: `console.log(sayHello("World"));`,
        selection: Selection.cursorAt(0, 12),
        expected: `const extracted = sayHello("World");
console.log(extracted);`
      },
      {
        description: "the correct variable when we have many",
        code: `console.log("Hello");
console.log("the", "World!", "Alright.");
console.log("How are you doing?");`,
        selection: Selection.cursorAt(1, 19),
        expected: `console.log("Hello");
const extracted = "World!";
console.log("the", extracted, "Alright.");
console.log("How are you doing?");`
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
        expected: `const extracted = "Hello!";
console.log({
  one: 1,
  foo: {
    bar: extracted
  }
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
        expected: `const extracted = "Hello!";
const a = {
  one: 1,
  foo: {
    bar: extracted
  }
};`
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
        expected: `const extracted = "javascriptreact";
const SUPPORTED_LANGUAGES = [
  "javascript",
  extracted,
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
      hello: "Hello!"
    }
  ]
]);`,
        selection: Selection.cursorAt(4, 13),
        expected: `const extracted = "Hello!";
console.log([
  1,
  [
    {
      hello: extracted
    }
  ]
]);`
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
        expected: `const extracted = { bar: true };
console.log({ foo: extracted });`
      },
      {
        description: "a spread variable",
        code: `console.log({ ...foo.bar });`,
        selection: Selection.cursorAt(0, 22),
        expected: `const extracted = { ...foo.bar };
console.log(extracted);`
      },
      {
        description: "a spread function result",
        code: `console.log({
  ...getInlinableCode(declaration),
  id: "name"
});`,
        selection: Selection.cursorAt(1, 11),
        expected: `const extracted = {
  ...getInlinableCode(declaration),
  id: "name"
};
console.log(extracted);`
      },
      {
        description:
          "a valid path when cursor is on a part of member expression",
        code: `console.log(path.node.name);`,
        selection: Selection.cursorAt(0, 17),
        expected: `const extracted = path.node;
console.log(extracted.name);`
      },
      {
        description: "a return value of a function",
        code: `function getMessage() {
  return "Hello!";
}`,
        selection: Selection.cursorAt(1, 9),
        expected: `function getMessage() {
  const extracted = "Hello!";
  return extracted;
}`
      },
      {
        description: "an assigned variable",
        code: `const message = "Hello!";`,
        selection: Selection.cursorAt(0, 16),
        expected: `const extracted = "Hello!";
const message = extracted;`
      },
      {
        description: "a class property assignment",
        code: `class Logger {
  message = "Hello!";
}`,
        selection: Selection.cursorAt(1, 12),
        expected: `const extracted = "Hello!";
class Logger {
  message = extracted;
}`
      },
      {
        description: "a computed class property",
        code: `class Logger {
  [key] = "value";
}`,
        selection: Selection.cursorAt(1, 3),
        expected: `const extracted = key;
class Logger {
  [extracted] = "value";
}`
      },
      {
        description: "an interpolated string when cursor is on a subpart of it",
        code: "console.log(`Hello ${world}! How are you doing?`);",
        selection: Selection.cursorAt(0, 15),
        expected: `const extracted = \`Hello \${world}! How are you doing?\`;
console.log(extracted);`
      },
      {
        description: "an if statement (whole statement)",
        code: "if (parents.length > 0 && type === 'refactor') doSomething();",
        selection: new Selection([0, 4], [0, 45]),
        expected: `const extracted = parents.length > 0 && type === 'refactor';
if (extracted) doSomething();`
      },
      {
        description: "an if statement (part of it)",
        code: "if (parents.length > 0 && type === 'refactor') doSomething();",
        selection: new Selection([0, 4], [0, 22]),
        expected: `const extracted = parents.length > 0;
if (extracted && type === 'refactor') doSomething();`
      },
      {
        description: "a multi-lines if statement (whole statement)",
        code: `if (
  parents.length > 0 &&
  type === 'refactor'
) doSomething();`,
        selection: new Selection([1, 2], [2, 21]),
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
  type === 'refactor'
) doSomething();`,
        selection: new Selection([2, 2], [2, 21]),
        expected: `const extracted = type === 'refactor';
if (
  parents.length > 0 &&
  extracted
) doSomething();`
      },
      {
        description: "a while statement",
        code:
          "while (parents.length > 0 && type === 'refactor') doSomething();",
        selection: new Selection([0, 7], [0, 48]),
        expected: `const extracted = parents.length > 0 && type === 'refactor';
while (extracted) doSomething();`
      },
      {
        description: "a case statement",
        code: `switch (text) {
  case "Hello!":
  default:
    break;
}`,
        selection: Selection.cursorAt(1, 7),
        expected: `const extracted = "Hello!";
switch (text) {
  case extracted:
  default:
    break;
}`
      },
      {
        description: "an unamed function parameter when cursor is inside",
        code: `console.log(function () {
  return "Hello!";
});`,
        selection: Selection.cursorAt(1, 0),
        expected: `const extracted = function () {
  return "Hello!";
};
console.log(extracted);`
      },
      {
        description: "an exported variable declaration",
        code: `export const something = {
  foo: "bar"
};`,
        selection: Selection.cursorAt(1, 9),
        expected: `const extracted = "bar";
export const something = {
  foo: extracted
};`
      },
      {
        description: "an object returned from arrow function",
        code: `const something = () => ({
  foo: "bar"
});`,
        selection: Selection.cursorAt(1, 9),
        expected: `const extracted = "bar";
const something = () => ({
  foo: extracted
});`
      },
      {
        description: "a value inside an arrow function",
        code: `() => (
  console.log("Hello")
)`,
        selection: Selection.cursorAt(1, 16),
        expected: `const extracted = "Hello";
() => (
  console.log(extracted)
)`
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
      },
      {
        description: "a multi-lines ternary",
        code: `function getText() {
  return isValid
    ? "yes"
    : "no";
}`,
        selection: Selection.cursorAt(2, 8),
        expected: `function getText() {
  const extracted = "yes";
  return isValid
    ? extracted
    : "no";
}`
      },
      {
        description: "a multi-lines unary expression",
        code: `if (
  !(threshold > 10 || isPaused)
) {
  console.log("Ship it");
}`,
        selection: Selection.cursorAt(1, 17),
        expected: `const extracted = 10;
if (
  !(threshold > extracted || isPaused)
) {
  console.log("Ship it");
}`
      },
      {
        description: "a variable in a JSX element",
        code: `function render() {
  return <div className="text-lg font-weight-bold">
    {this.props.location.name}
  </div>;
}`,
        selection: Selection.cursorAt(2, 27),
        // Note: maybe we'd like to improve this one (double `{}`)
        expected: `function render() {
  const extracted = this.props.location.name;
  return <div className="text-lg font-weight-bold">
    {{extracted}}
  </div>;
}`
      },
      {
        description: "a JSX element (cursor on opening tag)",
        code: `function render() {
  return <div className="text-lg font-weight-bold">
    {this.props.location.name}
  </div>;
}`,
        selection: Selection.cursorAt(1, 11),
        expected: `function render() {
  const extracted = <div className="text-lg font-weight-bold">
    {this.props.location.name}
  </div>;
  return extracted;
}`
      },
      {
        description: "a JSX element (cursor on closing tag)",
        code: `function render() {
  return <div className="text-lg font-weight-bold">
    {this.props.location.name}
  </div>;
}`,
        selection: Selection.cursorAt(3, 3),
        expected: `function render() {
  const extracted = <div className="text-lg font-weight-bold">
    {this.props.location.name}
  </div>;
  return extracted;
}`
      },
      {
        description: "an error instance",
        code: `console.log(new Error("It failed"));`,
        selection: Selection.cursorAt(0, 14),
        expected: `const extracted = new Error("It failed");
console.log(extracted);`
      },
      {
        description: "a call expression parameter (multi-lines)",
        code: `createIfStatement(
  parentPath.node.operator,
  parentPath.node.left,
  node.consequent
);`,
        selection: Selection.cursorAt(1, 20),
        expected: `const extracted = parentPath.node.operator;
createIfStatement(
  extracted,
  parentPath.node.left,
  node.consequent
);`
      },
      {
        description: "a conditional expression (multi-lines)",
        code: `const type = !!(
  path.node.loc.length > 0
) ? "with-loc"
  : "without-loc";`,
        selection: Selection.cursorAt(1, 17),
        expected: `const extracted = path.node.loc.length;
const type = !!(
  extracted > 0
) ? "with-loc"
  : "without-loc";`
      },
      {
        description: "a value in a JSXExpressionContainer",
        code: `<Component
  text={getTextForPerson({
    name: "Pedro"
  })}
/>`,
        selection: Selection.cursorAt(2, 12),
        expected: `const extracted = "Pedro";
<Component
  text={getTextForPerson({
    name: extracted
  })}
/>`
      },
      {
        description: "a value in a new Expression",
        code: `new Author(
  "name"
);`,
        selection: Selection.cursorAt(1, 2),
        expected: `const extracted = "name";
new Author(
  extracted
);`
      },
      {
        description: "a value in an Array argument of a function",
        code: `doSomething([
  getValueOf("name")
]);`,
        selection: Selection.cursorAt(1, 2),
        expected: `const extracted = getValueOf("name");
doSomething([
  extracted
]);`
      },
      {
        description: "a new Expression in an Array argument of a function",
        code: `doSomething([
  new Author("Eliott")
]);`,
        selection: Selection.cursorAt(1, 2),
        expected: `const extracted = new Author("Eliott");
doSomething([
  extracted
]);`
      },
      {
        description: "a value in a binary expression",
        code: `console.log(
  currentValue >
  10
);`,
        selection: Selection.cursorAt(2, 2),
        expected: `const extracted = 10;
console.log(
  currentValue >
  extracted
);`
      }
    ],
    async ({ code, selection, expected }) => {
      const result = await doExtractVariable(code, selection);
      expect(result).toBe(expected);
    }
  );

  it("should wrap extracted JSX element inside JSX Expression Container when inside another", async () => {
    const code = `function render() {
  return <div className="text-lg font-weight-bold">
    <p>{name}</p>
  </div>
}`;
    const selection = Selection.cursorAt(2, 4);

    const result = await doExtractVariable(code, selection);

    expect(result).toBe(`function render() {
  const extracted = <p>{name}</p>;
  return <div className="text-lg font-weight-bold">
    {extracted}
  </div>
}`);
  });

  it("should not wrap extracted JSX element inside JSX Expression Container when not inside another", async () => {
    const code = `function render() {
  return <p>{name}</p>;
}`;
    const selection = Selection.cursorAt(1, 9);

    const result = await doExtractVariable(code, selection);

    expect(result).toBe(`function render() {
  const extracted = <p>{name}</p>;
  return extracted;
}`);
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
      const result = await doExtractVariable(code, selection);

      expect(result).toBe(code);
    }
  );

  async function doExtractVariable(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const [readThenWrite, getCode] = createReadThenWriteInMemory(code);
    await extractVariable(
      code,
      selection,
      readThenWrite,
      delegateToEditor,
      showErrorMessage
    );
    return getCode();
  }
});
