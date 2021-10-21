import { Code, ErrorReason } from "../../editor/editor";
import { Position } from "../../editor/position";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { moveStatementUp } from "./move-statement-up";

describe("Move Statement Up", () => {
  testEach<{
    code: Code;
    expected: Code;
    expectedPosition: Position;
  }>(
    "should move statement up",
    [
      {
        description: "single-line statement",
        code: `console.log("I'm up");
[cursor]console.log("I'm down");`,
        expected: `console.log("I'm down");
console.log("I'm up");`,
        expectedPosition: new Position(0, 0)
      },
      {
        description: "multi-lines statement",
        code: `console.log("I'm up");

[cursor]if (isValid) {
  console.log("I'm down");
}`,
        expected: `if (isValid) {
  console.log("I'm down");
}

console.log("I'm up");`,
        expectedPosition: new Position(0, 0)
      },
      {
        description: "single-line statement moved above multi-lines statement",
        code: `if (isValid) {
  console.log("I'm up");
}

[cursor]console.log("I'm down");`,
        expected: `console.log("I'm down");

if (isValid) {
  console.log("I'm up");
}`,
        expectedPosition: new Position(0, 0)
      },
      {
        description: "multi-lines statement moved above multi-lines statement",
        code: `if (isValid) {
  console.log("I'm up");
}

[cursor]function saySomething() {
  console.log("I'm down");
}`,
        expected: `function saySomething() {
  console.log("I'm down");
}

if (isValid) {
  console.log("I'm up");
}`,
        expectedPosition: new Position(0, 0)
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
  const b = 2;
  const a = 1;

  if (isValid) {
    console.log("I shouldn't move");
    console.log("Me neither");
  }
}`,
        expectedPosition: new Position(3, 2)
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
  const b = { foo: "bar" };
  const a = 1;

  if (isValid) {
    console.log("I shouldn't move");
    console.log("Me neither");
  }
}`,
        expectedPosition: new Position(3, 15)
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
  const b = 2;
  const a = 1;

  if (isValid) {
    console.log("I shouldn't move");
    console.log("Me neither");
  }
}`,
        expectedPosition: new Position(3, 0)
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
  "bar",
  "foo",
  "baz"
];`,
        expectedPosition: new Position(2, 2)
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
  bar: "bar",
  foo: "foo",
  baz: "baz"
};`,
        expectedPosition: new Position(2, 2)
      },
      {
        description: "array elements, one-liner",
        code: `console.log("Should move in this scenario");
const data = ["foo", [cursor]"bar", "baz"];`,
        expected: `const data = ["foo", "bar", "baz"];
console.log("Should move in this scenario");`,
        expectedPosition: new Position(0, 21)
      },
      {
        description: "object properties, one-liner",
        code: `console.log("Should move in this scenario");
const data = { f[cursor]oo: "foo", bar: "bar" };`,
        expected: `const data = { foo: "foo", bar: "bar" };
console.log("Should move in this scenario");`,
        expectedPosition: new Position(0, 16)
      },
      {
        description: "object properties, one-liner, cursor on second",
        code: `console.log("Should move in this scenario");
const data = { foo: "foo", b[cursor]ar: "bar" };`,
        expected: `const data = { foo: "foo", bar: "bar" };
console.log("Should move in this scenario");`,
        expectedPosition: new Position(0, 28)
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
  bar: "bar",
  foo: "foo",
  baz: "baz"
};`,
        expectedPosition: new Position(2, 13)
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
  baz: "baz",
  bar: "bar"
};`,
        expectedPosition: new Position(2, 2)
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

  bar() {
    return "bar";
  },

  baz: "baz"
};`,
        expectedPosition: new Position(3, 2)
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
  getSize() {
    return 1;
  }

  getName() {
    return "foo";
  }
}`,
        expectedPosition: new Position(1, 2)
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
  getSize() {
    return 1;
  }

  name = "foo";
}`,
        expectedPosition: new Position(1, 2)
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
  getSize() {
    return 1;
  }
  getName() {
    return "foo";
  }
}`,
        expectedPosition: new Position(1, 2)
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
  getSize() {
    return 1;
  },
  getName() {
    return "foo";
  }
}`,
        expectedPosition: new Position(1, 2)
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
        expected: `function sayBye() {
  console.log("Bye")
}

function sayHello() {
  console.log("Hello")
}

function sayByeBye() {
  console.log("ByeBye")
}`,
        expectedPosition: new Position(0, 0)
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
function sayBye() {
  console.log("Bye")
}

// Helpers
function sayHello() {
  console.log("Hello")
}

function sayByeBye() {
  console.log("ByeBye")
}`,
        expectedPosition: new Position(4, 0)
      }
    ],
    async ({ code, expected, expectedPosition }) => {
      const editor = new InMemoryEditor(code);

      await moveStatementUp(editor);

      expect(editor.code).toBe(expected);
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
