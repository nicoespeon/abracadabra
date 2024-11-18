import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code } from "../../editor/editor";
import { moveStatementUp } from "./move-statement-up";

describe("Move Statement Up", () => {
  it("single-line statement", async () => {
    await shouldMoveStatementUp({
      code: `console.log("I'm up");
[cursor]console.log("I'm down");`,
      expected: `[cursor]console.log("I'm down");
console.log("I'm up");`
    });
  });

  it("multi-lines statement", async () => {
    await shouldMoveStatementUp({
      code: `console.log("I'm up");

[cursor]if (isValid) {
  console.log("I'm down");
}`,
      expected: `[cursor]if (isValid) {
  console.log("I'm down");
}

console.log("I'm up");`
    });
  });

  it("single-line statement moved above multi-lines statement", async () => {
    await shouldMoveStatementUp({
      code: `if (isValid) {
  console.log("I'm up");
}

[cursor]console.log("I'm down");`,
      expected: `[cursor]console.log("I'm down");

if (isValid) {
  console.log("I'm up");
}`
    });
  });

  it("multi-lines statement moved above multi-lines statement", async () => {
    await shouldMoveStatementUp({
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
    });
  });

  it("statement inside a container", async () => {
    await shouldMoveStatementUp({
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
    });
  });

  it("statement inside a container, cursor on object property", async () => {
    await shouldMoveStatementUp({
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
    });
  });

  it("statement inside a container, cursor at start of line", async () => {
    await shouldMoveStatementUp({
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
    });
  });

  it("array elements", async () => {
    await shouldMoveStatementUp({
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
    });
  });

  it("objects in an array", async () => {
    await shouldMoveStatementUp({
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
    });
  });

  it("object properties", async () => {
    await shouldMoveStatementUp({
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
    });
  });

  it("array elements, one-liner", async () => {
    await shouldMoveStatementUp({
      code: `console.log("Should move in this scenario");
const data = ["foo", [cursor]"bar", "baz"];`,
      expected: `const data = ["foo", [cursor]"bar", "baz"];
console.log("Should move in this scenario");`
    });
  });

  it("object properties, one-liner", async () => {
    await shouldMoveStatementUp({
      code: `console.log("Should move in this scenario");
const data = { f[cursor]oo: "foo", bar: "bar" };`,
      expected: `const data = { f[cursor]oo: "foo", bar: "bar" };
console.log("Should move in this scenario");`
    });
  });

  it("object properties, one-liner, cursor on second", async () => {
    await shouldMoveStatementUp({
      code: `console.log("Should move in this scenario");
const data = { foo: "foo", b[cursor]ar: "bar" };`,
      expected: `const data = { foo: "foo", b[cursor]ar: "bar" };
console.log("Should move in this scenario");`
    });
  });

  it("object properties, cursor after comma", async () => {
    await shouldMoveStatementUp({
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
    });
  });

  it("object property, respecting auto-trailing commas", async () => {
    await shouldMoveStatementUp({
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
    });
  });

  it("object property, respecting always-trailing commas", async () => {
    await shouldMoveStatementUp({
      code: `const data = {
  foo: "foo",
  bar: "bar",
  [cursor]baz: "baz",
};`,
      expected: `const data = {
  foo: "foo",
  [cursor]baz: "baz",
  bar: "bar",
};`
    });
  });

  it("object property, elements on the same line", async () => {
    await shouldMoveStatementUp({
      code: `const data = { foo: "foo", [cursor]bar: "bar" };`,
      expected: `const data = { [cursor]bar: "bar", foo: "foo" };`
    });
  });

  it("object method", async () => {
    await shouldMoveStatementUp({
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
    });
  });

  it("class method", async () => {
    await shouldMoveStatementUp({
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
    });
  });

  it("class property", async () => {
    await shouldMoveStatementUp({
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

  name = "foo"
}`
    });
  });

  it("class method without space between methods", async () => {
    await shouldMoveStatementUp({
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
    });
  });

  it("object method without space between methods", async () => {
    await shouldMoveStatementUp({
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
    });
  });

  it("three functions, cursor on the middle one", async () => {
    await shouldMoveStatementUp({
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
    });
  });

  it("three functions with comments", async () => {
    await shouldMoveStatementUp({
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
    });
  });

  it("JSX statements", async () => {
    await shouldMoveStatementUp({
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
    });
  });

  it("JSX expressions", async () => {
    await shouldMoveStatementUp({
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
    });
  });

  it("JSX attributes", async () => {
    await shouldMoveStatementUp({
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
    });
  });

  it("should do nothing, nor show an error message if selected statement is at the top of the file", async () => {
    const code = `console.log(
  "nothing up this statement"
[cursor])`;
    const editor = new InMemoryEditor(code);

    const result = moveStatementUp({
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

    const result = moveStatementUp({
      state: "new",
      code: editor.code,
      selection: editor.selection
    });

    expect(result.action).toBe("do nothing");
  });

  it("should not move the JSX element if it's the only one", async () => {
    const code = `function App() {
  return <>
    [cursor]<h1>Hello!</h1>
  </>;
}`;
    const editor = new InMemoryEditor(code);

    const result = moveStatementUp({
      state: "new",
      code: editor.code,
      selection: editor.selection
    });

    expect(result.action).toBe("show error");
  });

  it("should show an error message for multi-lines selections", async () => {
    const code = `console.log("First");
[start]console.log("Second");
[end]console.log("Third")`;
    const editor = new InMemoryEditor(code);

    const result = moveStatementUp({
      state: "new",
      code: editor.code,
      selection: editor.selection
    });

    expect(result.action).toBe("show error");
  });
});

async function shouldMoveStatementUp({
  code,
  expected
}: {
  code: Code;
  expected: Code;
}) {
  const editor = new InMemoryEditor(code);

  const result = moveStatementUp({
    state: "new",
    code: editor.code,
    selection: editor.selection
  });

  if (result.action !== "read then write") {
    return fail(`Expected 'read then write' action, but got ${result.action}`);
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
