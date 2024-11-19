import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { Code } from "../../../editor/editor";
import { moveStatementDown } from "./move-statement-down";

describe("Move Statement Down", () => {
  it("single-line statement", async () => {
    await shouldMoveStatementDown({
      code: `[cursor]console.log("I'm up");
console.log("I'm down");`,
      expected: `console.log("I'm down");
[cursor]console.log("I'm up");`
    });
  });

  it("single-line statement moved below multi-lines statement", async () => {
    await shouldMoveStatementDown({
      code: `[cursor]console.log("I'm up");

if (isValid) {
  console.log("I'm down");
}`,
      expected: `if (isValid) {
  console.log("I'm down");
}

[cursor]console.log("I'm up");`
    });
  });

  it("multi-lines statement", async () => {
    await shouldMoveStatementDown({
      code: `if (isValid) {
  console.log("I'm up");
}

console.log("I'm down");`,
      expected: `console.log("I'm down");

[cursor]if (isValid) {
  console.log("I'm up");
}`
    });
  });

  it("multi-lines statement moved below multi-lines statement", async () => {
    await shouldMoveStatementDown({
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
    });
  });

  it("statement inside a container", async () => {
    await shouldMoveStatementDown({
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
    });
  });

  it("statement inside a container, cursor at start of line", async () => {
    await shouldMoveStatementDown({
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
    });
  });

  it("statement below is a function, without space in-between", async () => {
    await shouldMoveStatementDown({
      code: `console.log("First");
function doSomething() {
  console.log("Second");
}`,
      expected: `function doSomething() {
  console.log("Second");
}
[cursor]console.log("First");`
    });
  });

  it("statement below is a function, with space in-between", async () => {
    await shouldMoveStatementDown({
      code: `console.log("First");

function doSomething() {
  console.log("Second");
}`,
      expected: `function doSomething() {
  console.log("Second");
}

[cursor]console.log("First");`
    });
  });

  it("statement below is a function, without space in-between + statement above", async () => {
    await shouldMoveStatementDown({
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
    });
  });

  it("array elements", async () => {
    await shouldMoveStatementDown({
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
    });
  });

  it("objects in an array", async () => {
    await shouldMoveStatementDown({
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
    });
  });

  it("array elements, one-liner", async () => {
    await shouldMoveStatementDown({
      code: `const data = [[cursor]"foo", "bar", "baz"];
console.log("Should move in this scenario");`,
      expected: `console.log("Should move in this scenario");
const data = [[cursor]"foo", "bar", "baz"];`
    });
  });

  it("object properties", async () => {
    await shouldMoveStatementDown({
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
    });
  });

  it("object properties, cursor on closing bracket", async () => {
    await shouldMoveStatementDown({
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
    });
  });

  it("object properties, one-liner, cursor on first", async () => {
    await shouldMoveStatementDown({
      code: `const data = { f[cursor]oo: "foo", bar: "bar" };
console.log("Should move in this scenario");`,
      expected: `console.log("Should move in this scenario");
const data = { f[cursor]oo: "foo", bar: "bar" };`
    });
  });

  it("object properties, one-liner, cursor on second", async () => {
    await shouldMoveStatementDown({
      code: `const data = { foo: "foo", b[cursor]ar: "bar" };
console.log("Should move in this scenario");`,
      expected: `console.log("Should move in this scenario");
const data = { foo: "foo", b[cursor]ar: "bar" };`
    });
  });

  it("object properties, cursor after comma", async () => {
    await shouldMoveStatementDown({
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
    });
  });

  it("object property, respecting trailing commas", async () => {
    await shouldMoveStatementDown({
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
    });
  });

  it("object method", async () => {
    await shouldMoveStatementDown({
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
    });
  });

  it("class method", async () => {
    await shouldMoveStatementDown({
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
    });
  });

  it("class property", async () => {
    await shouldMoveStatementDown({
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

  [cursor]name = "foo"
}`
    });
  });

  it("class method without space between methods", async () => {
    await shouldMoveStatementDown({
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
    });
  });

  it("object method without space between methods", async () => {
    await shouldMoveStatementDown({
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
    });
  });

  it("three functions with comments", async () => {
    await shouldMoveStatementDown({
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
    });
  });

  it("JSX statements", async () => {
    await shouldMoveStatementDown({
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
    });
  });

  it("JSX expressions", async () => {
    await shouldMoveStatementDown({
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
    });
  });

  it("JSX attributes", async () => {
    await shouldMoveStatementDown({
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
    });
  });

  it("should do nothing, nor show an error message if selected statement is at the bottom of the file", async () => {
    const code = `console.log(
  "nothing below this statement"
)`;
    const editor = new InMemoryEditor(code);

    const result = moveStatementDown({
      state: "new",
      code: editor.code,
      selection: editor.selection
    });

    expect(result.action).toBe("do nothing");
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

    const result = moveStatementDown({
      state: "new",
      code: editor.code,
      selection: editor.selection
    });

    expect(result.action).toBe("do nothing");
  });

  it("should show an error message for multi-lines selections", async () => {
    const code = `console.log("First");
[start]console.log("Second");
[end]console.log("Third")`;
    const editor = new InMemoryEditor(code);

    const result = moveStatementDown({
      state: "new",
      code: editor.code,
      selection: editor.selection
    });

    expect(result.action).toBe("show error");
  });
});

async function shouldMoveStatementDown({
  code,
  expected
}: {
  code: Code;
  expected: Code;
}) {
  const editor = new InMemoryEditor(code);

  const result = moveStatementDown({
    state: "new",
    code: editor.code,
    selection: editor.selection
  });

  if (result.action !== "read then write") {
    throw new Error(
      `Expected 'read then write' action, but got '${result.action}'`
    );
  }
  await editor.readThenWrite(
    result.readSelection,
    result.getModifications,
    result.newCursorPosition
  );
  const { code: expectedCode, selection: expectedSelection } =
    new InMemoryEditor(expected);
  expect(editor.code).toBe(expectedCode);
  expect(editor.selection).toEqual(expectedSelection);
}
