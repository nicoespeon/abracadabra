import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { Position } from "../../editor/position";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { moveStatementUp } from "./move-statement-up";

describe("Move Statement Up", () => {
  let showErrorMessage: Editor["showError"];

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{
    code: Code;
    selection: Selection;
    expected: Code;
    expectedPosition: Position;
  }>(
    "should move statement up",
    [
      {
        description: "single-line statement",
        code: `console.log("I'm up");
console.log("I'm down");`,
        selection: Selection.cursorAt(1, 0),
        expected: `console.log("I'm down");
console.log("I'm up");`,
        expectedPosition: new Position(0, 0)
      },
      {
        description: "multi-lines statement",
        code: `console.log("I'm up");

if (isValid) {
  console.log("I'm down");
}`,
        selection: Selection.cursorAt(2, 0),
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

console.log("I'm down");`,
        selection: Selection.cursorAt(4, 0),
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

function saySomething() {
  console.log("I'm down");
}`,
        selection: Selection.cursorAt(4, 0),
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
  const b = 2;

  if (isValid) {
    console.log("I shouldn't move");
    console.log("Me neither");
  }
}`,
        selection: Selection.cursorAt(4, 2),
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
        description: "statement inside a container, cursor at start of line",
        code: `const hello = "world";

function doSomethingElse() {
  const a = 1;
  const b = 2;

  if (isValid) {
    console.log("I shouldn't move");
    console.log("Me neither");
  }
}`,
        selection: Selection.cursorAt(4, 0),
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
        description: "object properties",
        code: `console.log("Should not move");
const data = {
  foo: "foo",
  bar: "bar",
  baz: "baz"
};`,
        selection: Selection.cursorAt(3, 2),
        expected: `console.log("Should not move");
const data = {
  bar: "bar",
  foo: "foo",
  baz: "baz"
};`,
        expectedPosition: new Position(2, 2)
      },
      {
        description: "object properties, one-liner",
        code: `console.log("Should move in this scenario");
const data = { foo: "foo", bar: "bar" };`,
        selection: Selection.cursorAt(1, 16),
        expected: `const data = { foo: "foo", bar: "bar" };
console.log("Should move in this scenario");`,
        expectedPosition: new Position(0, 16)
      },
      {
        description: "object properties, cursor after comma",
        code: `console.log("Should not move");
const data = {
  foo: "foo",
  bar: "bar",
  baz: "baz"
};`,
        selection: Selection.cursorAt(3, 13),
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
  baz: "baz"
};`,
        selection: Selection.cursorAt(3, 2),
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
  bar() {
    return "bar";
  }
};`,
        selection: Selection.cursorAt(3, 2),
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

  getSize() {
    return 1;
  }
}`,
        selection: Selection.cursorAt(5, 2),
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

  getSize() {
    return 1;
  }
}`,
        selection: Selection.cursorAt(3, 2),
        expected: `class Node {
  getSize() {
    return 1;
  }

  name = "foo";
}`,
        expectedPosition: new Position(1, 2)
      }
    ],
    async ({ code, selection, expected, expectedPosition }) => {
      const result = await doMoveStatementUp(code, selection);

      expect(result.code).toBe(expected);
      expect(result.position).toStrictEqual(expectedPosition);
    }
  );

  it("should do nothing, nor show an error message if selected statement is at the top of the file", async () => {
    const code = `console.log(
  "nothing up this statement"
)`;
    const selection = Selection.cursorAt(2, 0);

    const result = await doMoveStatementUp(code, selection);

    expect(result.code).toBe(code);
    expect(showErrorMessage).not.toBeCalled();
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
  getName() {
    return "bar";
  }
}`;
    const selection = Selection.cursorAt(11, 2);

    const result = await doMoveStatementUp(code, selection);

    expect(result.code).toBe(code);
  });

  it("should show an error message for multi-lines selections", async () => {
    const code = `console.log("First");
console.log("Second");
console.log("Third")`;
    const selection = new Selection([1, 0], [2, 0]);

    await doMoveStatementUp(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.CantMoveMultiLinesStatementUp
    );
  });

  it("should show an error message if selection is invalid", async () => {
    const code = `console.log("First");`;
    const invalidSelection = Selection.cursorAt(2, 0);

    await doMoveStatementUp(code, invalidSelection);

    expect(showErrorMessage).toBeCalledWith(ErrorReason.CantMoveStatementUp);
  });

  async function doMoveStatementUp(
    code: Code,
    selection: Selection
  ): Promise<{ code: Code; position: Position }> {
    const editor = new InMemoryEditor(code);
    editor.showError = showErrorMessage;
    await moveStatementUp(code, selection, editor);
    return { code: editor.code, position: editor.position };
  }
});
