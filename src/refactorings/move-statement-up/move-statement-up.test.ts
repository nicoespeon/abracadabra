import { Code, ErrorReason } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { moveStatementUp } from "./move-statement-up";

describe("Move Statement Up", () => {
  testEach<{
    code: Code;
    expected: Code;
  }>(
    "should move statement up",
    [
      {
        description: "single-line statement",
        code: `console.log("I'm up");
[cursor]console.log("I'm down");`,
        expected: `[cursor]console.log("I'm down");
console.log("I'm up");`
      },
      {
        description: "multi-lines statement",
        code: `console.log("I'm up");

[cursor]if (isValid) {
  console.log("I'm down");
}`,
        expected: `[cursor]if (isValid) {
  console.log("I'm down");
}

console.log("I'm up");`
      },
      {
        description: "single-line statement moved above multi-lines statement",
        code: `if (isValid) {
  console.log("I'm up");
}

[cursor]console.log("I'm down");`,
        expected: `[cursor]console.log("I'm down");

if (isValid) {
  console.log("I'm up");
}`
      },
      {
        description: "multi-lines statement moved above multi-lines statement",
        code: `if (isValid) {
  console.log("I'm up");
}

[cursor]function saySomething() {
  console.log("I'm down");
}`,
        expected: `[cursor]function saySomething() {
  console.log("I'm down");
}

if (isValid) {
  console.log("I'm up");
}`
      },
      {
        description: "statement inside a container",
        code: `const hello = "world";

function doSomethingElse() {
  const a = 1;
  [cursor]const b = 2;

  if (isValid) {
    console.log("I shouldn't move");
    console.log("Me neither");
  }
}`,
        expected: `const hello = "world";

function doSomethingElse() {
  [cursor]const b = 2;
  const a = 1;

  if (isValid) {
    console.log("I shouldn't move");
    console.log("Me neither");
  }
}`
      },
      {
        description: "statement inside a container, cursor on object property",
        code: `const hello = "world";

function doSomethingElse() {
  const a = 1;
  const b = { f[cursor]oo: "bar" };

  if (isValid) {
    console.log("I shouldn't move");
    console.log("Me neither");
  }
}`,
        expected: `const hello = "world";

function doSomethingElse() {
  const b = { f[cursor]oo: "bar" };
  const a = 1;

  if (isValid) {
    console.log("I shouldn't move");
    console.log("Me neither");
  }
}`
      },
      {
        description: "statement inside a container, cursor at start of line",
        code: `const hello = "world";

function doSomethingElse() {
  const a = 1;
[cursor]  const b = 2;

  if (isValid) {
    console.log("I shouldn't move");
    console.log("Me neither");
  }
}`,
        expected: `const hello = "world";

function doSomethingElse() {
[cursor]  const b = 2;
  const a = 1;

  if (isValid) {
    console.log("I shouldn't move");
    console.log("Me neither");
  }
}`
      },
      {
        description: "array elements",
        code: `console.log("Should not move");
const data = [
  "foo",
  [cursor]"bar",
  "baz"
];`,
        expected: `console.log("Should not move");
const data = [
  [cursor]"bar",
  "foo",
  "baz"
];`
      },
      {
        description: "objects in an array",
        code: `console.log("Should not move");
const data = [
  {
    foo: "foo"
  },
  [cursor]{
    bar: "bar"
  },
  {
    baz: "baz"
  }
];`,
        expected: `console.log("Should not move");
const data = [
  [cursor]{
    bar: "bar"
  },
  {
    foo: "foo"
  },
  {
    baz: "baz"
  }
];`
      },
      {
        description: "object properties",
        code: `console.log("Should not move");
const data = {
  foo: "foo",
  [cursor]bar: "bar",
  baz: "baz"
};`,
        expected: `console.log("Should not move");
const data = {
  [cursor]bar: "bar",
  foo: "foo",
  baz: "baz"
};`
      },
      {
        description: "array elements, one-liner",
        code: `console.log("Should move in this scenario");
const data = ["foo", [cursor]"bar", "baz"];`,
        expected: `const data = ["foo", [cursor]"bar", "baz"];
console.log("Should move in this scenario");`
      },
      {
        description: "object properties, one-liner",
        code: `console.log("Should move in this scenario");
const data = { f[cursor]oo: "foo", bar: "bar" };`,
        expected: `const data = { f[cursor]oo: "foo", bar: "bar" };
console.log("Should move in this scenario");`
      },
      {
        description: "object properties, one-liner, cursor on second",
        code: `console.log("Should move in this scenario");
const data = { foo: "foo", b[cursor]ar: "bar" };`,
        expected: `const data = { foo: "foo", b[cursor]ar: "bar" };
console.log("Should move in this scenario");`
      },
      {
        description: "object properties, cursor after comma",
        code: `console.log("Should not move");
const data = {
  foo: "foo",
  bar: "bar",[cursor]
  baz: "baz"
};`,
        expected: `console.log("Should not move");
const data = {
  bar: "bar",[cursor]
  foo: "foo",
  baz: "baz"
};`
      },
      {
        description: "object property, respecting trailing commas",
        code: `const data = {
  foo: "foo",
  bar: "bar",
  [cursor]baz: "baz"
};`,
        expected: `const data = {
  foo: "foo",
  [cursor]baz: "baz",
  bar: "bar"
};`
      },
      {
        description: "object method",
        code: `const data = {
  foo: "foo",
  baz: "baz",
  [cursor]bar() {
    return "bar";
  }
};`,
        expected: `const data = {
  foo: "foo",

  [cursor]bar() {
    return "bar";
  },

  baz: "baz"
};`
      },
      {
        description: "class method",
        code: `class Node {
  getName() {
    return "foo";
  }

  [cursor]getSize() {
    return 1;
  }
}`,
        expected: `class Node {
  [cursor]getSize() {
    return 1;
  }

  getName() {
    return "foo";
  }
}`
      },
      {
        description: "class property",
        code: `class Node {
  name = "foo"

  [cursor]getSize() {
    return 1;
  }
}`,
        expected: `class Node {
  [cursor]getSize() {
    return 1;
  }

  name = "foo";
}`
      },
      {
        description: "class method without space between methods",
        code: `class Node {
  getName() {
    return "foo";
  }
  [cursor]getSize() {
    return 1;
  }
}`,
        expected: `class Node {
  [cursor]getSize() {
    return 1;
  }
  getName() {
    return "foo";
  }
}`
      },
      {
        description: "object method without space between methods",
        code: `const node = {
  getName() {
    return "foo";
  },
  [cursor]getSize() {
    return 1;
  }
}`,
        expected: `const node = {
  [cursor]getSize() {
    return 1;
  },
  getName() {
    return "foo";
  }
}`
      },
      {
        description: "three functions, cursor on the middle one",
        code: `function sayHello() {
  console.log("Hello")
}

[cursor]function sayBye() {
  console.log("Bye")
}

function sayByeBye() {
  console.log("ByeBye")
}`,
        expected: `[cursor]function sayBye() {
  console.log("Bye")
}

function sayHello() {
  console.log("Hello")
}

function sayByeBye() {
  console.log("ByeBye")
}`
      },
      {
        description: "three functions with comments",
        code: `// Helpers
function sayHello() {
  console.log("Hello")
}

/**
 * Say bye to people
 */
// Farewell, friends
[cursor]function sayBye() {
  console.log("Bye")
}

function sayByeBye() {
  console.log("ByeBye")
}`,
        expected: `/**
 * Say bye to people
 */
// Farewell, friends
[cursor]function sayBye() {
  console.log("Bye")
}

// Helpers
function sayHello() {
  console.log("Hello")
}

function sayByeBye() {
  console.log("ByeBye")
}`
      },
      {
        description: "JSX statements",
        code: `function App() {
  return <>
    <p>How are you?</p>
    [cursor]<h1>Hello!</h1>
  </>;
}`,
        expected: `function App() {
  return <>
    [cursor]<h1>Hello!</h1>
    <p>How are you?</p>
  </>;
}`
      },
      {
        description: "JSX expressions",
        code: `function App() {
  return <>
    <p>How are you?</p>
    [cursor]{hello}
  </>;
}`,
        expected: `function App() {
  return <>
    [cursor]{hello}
    <p>How are you?</p>
  </>;
}`
      },
      {
        description: "JSX attributes",
        code: `const Component = (...inputProps) => (
  <input
    css={{
      color: darkred,
      background: white
    }}
    [cursor]tw="w-full py-1 text-lg border border-none rounded"
  />
)`,
        expected: `const Component = (...inputProps) => (
  <input
    [cursor]tw="w-full py-1 text-lg border border-none rounded"
    css={{
      color: darkred,
      background: white
    }}
  />
)`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await moveStatementUp(editor);

      const { code: expectedCode, position: expectedPosition } =
        new InMemoryEditor(expected);
      expect(editor.code).toBe(expectedCode);
      expect(editor.position).toStrictEqual(expectedPosition);
    }
  );

  it("should do nothing, nor show an error message if selected statement is at the top of the file", async () => {
    const code = `console.log(
  "nothing up this statement"
[cursor])`;
    const editor = new InMemoryEditor(code);
    const originalCode = editor.code;
    jest.spyOn(editor, "showError");

    await moveStatementUp(editor);

    expect(editor.code).toBe(originalCode);
    expect(editor.showError).not.toBeCalled();
  });

  it("should not move the parent node if the selected child node can't be moved", async () => {
    const code = `class Node {
  getSize() {
    return 1;
  }

  getName() {
    return "foo";
  }
}

class Path {
  [cursor]getName() {
    return "bar";
  }
}`;
    const editor = new InMemoryEditor(code);
    const originalCode = editor.code;

    await moveStatementUp(editor);

    expect(editor.code).toBe(originalCode);
  });

  it("should not move the JSX element if it's the only one", async () => {
    const code = `function App() {
  return <>
    [cursor]<h1>Hello!</h1>
  </>;
}`;
    const editor = new InMemoryEditor(code);
    const originalCode = editor.code;

    await moveStatementUp(editor);

    expect(editor.code).toBe(originalCode);
  });

  it("should show an error message for multi-lines selections", async () => {
    const code = `console.log("First");
[start]console.log("Second");
[end]console.log("Third")`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await moveStatementUp(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.CantMoveMultiLinesStatementUp
    );
  });
});
