import { Code, ErrorReason } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { moveStatementDown } from "./move-statement-down";

describe("Move Statement Down", () => {
  testEach<{
    code: Code;
    expected: Code;
  }>(
    "should move statement down",
    [
      {
        description: "single-line statement",
        code: `console.log("I'm up");
console.log("I'm down");`,
        expected: `console.log("I'm down");
[cursor]console.log("I'm up");`
      },
      {
        description: "single-line statement moved below multi-lines statement",
        code: `console.log("I'm up");

if (isValid) {
  console.log("I'm down");
}`,
        expected: `if (isValid) {
  console.log("I'm down");
}

[cursor]console.log("I'm up");`
      },
      {
        description: "multi-lines statement",
        code: `if (isValid) {
  console.log("I'm up");
}

console.log("I'm down");`,
        expected: `console.log("I'm down");

[cursor]if (isValid) {
  console.log("I'm up");
}`
      },
      {
        description: "multi-lines statement moved below multi-lines statement",
        code: `if (isValid) {
  console.log("I'm up");
}

function saySomething() {
  console.log("I'm down");
}`,
        expected: `function saySomething() {
  console.log("I'm down");
}

[cursor]if (isValid) {
  console.log("I'm up");
}`
      },
      {
        description: "statement inside a container",
        code: `function doSomethingElse() {
  [cursor]const a = 1;
  const b = 2;

  if (isValid) {
    console.log("I shouldn't move");
    console.log("Me neither");
  }
}

const hello = "world";`,
        expected: `function doSomethingElse() {
  const b = 2;
  [cursor]const a = 1;

  if (isValid) {
    console.log("I shouldn't move");
    console.log("Me neither");
  }
}

const hello = "world";`
      },
      {
        description: "statement inside a container, cursor at start of line",
        code: `function doSomethingElse() {
[cursor]  const a = 1;
  const b = 2;

  if (isValid) {
    console.log("I shouldn't move");
    console.log("Me neither");
  }
}

const hello = "world";`,
        expected: `function doSomethingElse() {
  const b = 2;
[cursor]  const a = 1;

  if (isValid) {
    console.log("I shouldn't move");
    console.log("Me neither");
  }
}

const hello = "world";`
      },
      {
        description: "statement below is a function, without space in-between",
        code: `console.log("First");
function doSomething() {
  console.log("Second");
}`,
        expected: `function doSomething() {
  console.log("Second");
}

[cursor]console.log("First");`
      },
      {
        description: "statement below is a function, with space in-between",
        code: `console.log("First");

function doSomething() {
  console.log("Second");
}`,
        expected: `function doSomething() {
  console.log("Second");
}

[cursor]console.log("First");`
      },
      {
        description:
          "statement below is a function, without space in-between + statement above",
        code: `console.log("First");
[cursor]console.log("Second");
function doSomething() {
  console.log("Third");
}`,
        expected: `console.log("First");

function doSomething() {
  console.log("Third");
}

[cursor]console.log("Second");`
      },
      {
        description: "array elements",
        code: `const data = [
  [cursor]"foo",
  "bar",
  "baz"
];
console.log("Should not move");`,
        expected: `const data = [
  "bar",
  [cursor]"foo",
  "baz"
];
console.log("Should not move");`
      },
      {
        description: "objects in an array",
        code: `console.log("Should not move");
const data = [
  [cursor]{
    foo: "foo"
  },
  {
    bar: "bar"
  },
  {
    baz: "baz"
  }
];`,
        expected: `console.log("Should not move");
const data = [
  {
    bar: "bar"
  },
  [cursor]{
    foo: "foo"
  },
  {
    baz: "baz"
  }
];`
      },
      {
        description: "array elements, one-liner",
        code: `const data = [[cursor]"foo", "bar", "baz"];
console.log("Should move in this scenario");`,
        expected: `console.log("Should move in this scenario");
const data = [[cursor]"foo", "bar", "baz"];`
      },
      {
        description: "object properties",
        code: `const data = {
  [cursor]foo: "foo",
  bar: "bar",
  baz: "baz"
};
console.log("Should not move");`,
        expected: `const data = {
  bar: "bar",
  [cursor]foo: "foo",
  baz: "baz"
};
console.log("Should not move");`
      },
      {
        description: "object properties, cursor on closing bracket",
        code: `const data = {[cursor]
  foo: "foo",
  bar: "bar",
  baz: "baz"
};
console.log("Should move");`,
        expected: `console.log("Should move");
const data = {[cursor]
  foo: "foo",
  bar: "bar",
  baz: "baz"
};`
      },
      {
        description: "object properties, one-liner, cursor on first",
        code: `const data = { f[cursor]oo: "foo", bar: "bar" };
console.log("Should move in this scenario");`,
        expected: `console.log("Should move in this scenario");
const data = { f[cursor]oo: "foo", bar: "bar" };`
      },
      {
        description: "object properties, one-liner, cursor on second",
        code: `const data = { foo: "foo", b[cursor]ar: "bar" };
console.log("Should move in this scenario");`,
        expected: `console.log("Should move in this scenario");
const data = { foo: "foo", b[cursor]ar: "bar" };`
      },
      {
        description: "object properties, cursor after comma",
        code: `const data = {
  foo: "foo",[cursor]
  bar: "bar",
  baz: "baz"
};
console.log("Should not move");`,
        expected: `const data = {
  bar: "bar",
  foo: "foo",[cursor]
  baz: "baz"
};
console.log("Should not move");`
      },
      {
        description: "object property, respecting trailing commas",
        code: `const data = {
  foo: "foo",
  [cursor]bar: "bar",
  baz: "baz"
};`,
        expected: `const data = {
  foo: "foo",
  baz: "baz",
  [cursor]bar: "bar"
};`
      },
      {
        description: "object method",
        code: `const data = {
  [cursor]foo() {
    return "foo";
  },
  bar: "bar"
};`,
        expected: `const data = {
  bar: "bar",

  [cursor]foo() {
    return "foo";
  }
};`
      },
      {
        description: "class method",
        code: `class Node {
  [cursor]getName() {
    return "foo";
  }

  getSize() {
    return 1;
  }
}`,
        expected: `class Node {
  getSize() {
    return 1;
  }

  [cursor]getName() {
    return "foo";
  }
}`
      },
      {
        description: "class property",
        code: `class Node {
  [cursor]name = "foo"

  getSize() {
    return 1;
  }
}`,
        expected: `class Node {
  getSize() {
    return 1;
  }

  [cursor]name = "foo";
}`
      },
      {
        description: "class method without space between methods",
        code: `class Node {
  [cursor]getName() {
    return "foo";
  }
  getSize() {
    return 1;
  }
}`,
        expected: `class Node {
  getSize() {
    return 1;
  }
  [cursor]getName() {
    return "foo";
  }
}`
      },
      {
        description: "object method without space between methods",
        code: `const node = {
  [cursor]getName() {
    return "foo";
  },
  getSize() {
    return 1;
  }
}`,
        expected: `const node = {
  getSize() {
    return 1;
  },
  [cursor]getName() {
    return "foo";
  }
}`
      },
      {
        description: "three functions with comments",
        code: `// Helpers
// And stuff…
[cursor]function sayHello() {
  console.log("Hello")
}

/**
 * Say bye to people
 */
// Farewell, friends
function sayBye() {
  console.log("Bye")
}

function sayByeBye() {
  console.log("ByeBye")
}`,
        expected: `/**
 * Say bye to people
 */
// Farewell, friends
function sayBye() {
  console.log("Bye")
}

// Helpers
// And stuff…
[cursor]function sayHello() {
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
    [cursor]<p>How are you?</p>
    <h1>Hello!</h1>
  </>;
}`,
        expected: `function App() {
  return <>
    <h1>Hello!</h1>
    [cursor]<p>How are you?</p>
  </>;
}`
      },
      {
        description: "JSX expressions",
        code: `function App() {
  return <>
    [cursor]{howAreYou}
    <h1>Hello!</h1>
  </>;
}`,
        expected: `function App() {
  return <>
    <h1>Hello!</h1>
    [cursor]{howAreYou}
  </>;
}`
      },
      {
        description: "JSX attributes",
        code: `const Component = (...inputProps) => (
  <input
    [cursor]tw="w-full py-1 text-lg border border-none rounded"
    css={{
      color: darkred,
      background: white
    }}
  />
)`,
        expected: `const Component = (...inputProps) => (
  <input
    css={{
      color: darkred,
      background: white
    }}
    [cursor]tw="w-full py-1 text-lg border border-none rounded"
  />
)`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await moveStatementDown(editor);

      const { code: expectedCode, position: expectedPosition } =
        new InMemoryEditor(expected);
      expect(editor.code).toBe(expectedCode);
      expect(editor.position).toStrictEqual(expectedPosition);
    }
  );

  it("should do nothing, nor show an error message if selected statement is at the bottom of the file", async () => {
    const code = `console.log(
  "nothing below this statement"
)`;
    const editor = new InMemoryEditor(code);
    const originalCode = editor.code;
    jest.spyOn(editor, "showError");

    await moveStatementDown(editor);

    expect(editor.code).toBe(originalCode);
    expect(editor.showError).not.toHaveBeenCalled();
  });

  it("should not move the parent node if the selected child node can't be moved", async () => {
    const code = `class Node {
  getSize() {
    return 1;
  }

  [cursor]getName() {
    return "foo";
  }
}

class Path {
  getName() {
    return "bar";
  }
}`;
    const editor = new InMemoryEditor(code);
    const originalCode = editor.code;

    await moveStatementDown(editor);

    expect(editor.code).toBe(originalCode);
  });

  it("should show an error message for multi-lines selections", async () => {
    const code = `console.log("First");
[start]console.log("Second");
[end]console.log("Third")`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await moveStatementDown(editor);

    expect(editor.showError).toHaveBeenCalledWith(
      ErrorReason.CantMoveMultiLinesStatementDown
    );
  });
});
