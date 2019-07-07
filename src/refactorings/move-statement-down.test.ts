import { Code } from "./editor/i-write-code";
import { Selection } from "./editor/selection";
import { Position } from "./editor/position";
import { ShowErrorMessage, ErrorReason } from "./editor/i-show-error-message";
import { createWriteInMemory } from "./adapters/write-code-in-memory";
import { moveStatementDown } from "./move-statement-down";

describe("Move Statement Down", () => {
  let showErrorMessage: ShowErrorMessage;

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  it.each<[string, { code: Code; selection: Selection; expected: Code }]>([
    [
      "single-line statement",
      {
        code: `console.log("I'm up");
console.log("I'm down");`,
        selection: Selection.cursorAt(0, 0),
        expected: `console.log("I'm down");
console.log("I'm up");`
      }
    ],
    [
      "single-line statement moved below multi-lines statement",
      {
        code: `console.log("I'm up");

if (isValid) {
  console.log("I'm down");
}`,
        selection: Selection.cursorAt(0, 0),
        expected: `if (isValid) {
  console.log("I'm down");
}

console.log("I'm up");`
      }
    ],
    [
      "multi-lines statement",
      {
        code: `if (isValid) {
  console.log("I'm up");
}

console.log("I'm down");`,
        selection: Selection.cursorAt(0, 0),
        expected: `console.log("I'm down");

if (isValid) {
  console.log("I'm up");
}`
      }
    ],
    [
      "multi-lines statement moved below multi-lines statement",
      {
        code: `if (isValid) {
  console.log("I'm up");
}

function saySomething() {
  console.log("I'm down");
}`,
        selection: Selection.cursorAt(0, 0),
        expected: `function saySomething() {
  console.log("I'm down");
}

if (isValid) {
  console.log("I'm up");
}`
      }
    ],
    [
      "statement inside a container",
      {
        code: `function doSomethingElse() {
  const a = 1;
  const b = 2;

  if (isValid) {
    console.log("I shouldn't move");
    console.log("Me neither");
  }
}

const hello = "world";`,
        selection: Selection.cursorAt(1, 2),
        expected: `function doSomethingElse() {
  const b = 2;
  const a = 1;

  if (isValid) {
    console.log("I shouldn't move");
    console.log("Me neither");
  }
}

const hello = "world";`
      }
    ],
    [
      "statement inside a container, cursor at start of line",
      {
        code: `function doSomethingElse() {
  const a = 1;
  const b = 2;

  if (isValid) {
    console.log("I shouldn't move");
    console.log("Me neither");
  }
}

const hello = "world";`,
        selection: Selection.cursorAt(1, 0),
        expected: `function doSomethingElse() {
  const b = 2;
  const a = 1;

  if (isValid) {
    console.log("I shouldn't move");
    console.log("Me neither");
  }
}

const hello = "world";`
      }
    ]
  ])(
    "should move statement down (%s)",
    async (_, { code, selection, expected }) => {
      const result = await doMoveStatementDown(code, selection);

      expect(result.code).toBe(expected);
    }
  );

  it("should set editor cursor at moved statement new position", async () => {
    const code = `if (isValid) {
  console.log("First");
  console.log("Second");
  console.log("Third");
}`;
    const selection = Selection.cursorAt(1, 5);

    const result = await doMoveStatementDown(code, selection);

    expect(result.position).toStrictEqual(new Position(2, 5));
  });

  it("should set editor cursor at moved statement new position (multi-lines)", async () => {
    const code = `console.log("First");

function doSomething() {
  console.log("Second");
}

console.log("Third");`;
    const selection = Selection.cursorAt(0, 0);

    const result = await doMoveStatementDown(code, selection);

    const expected = `function doSomething() {
  console.log("Second");
}

console.log("First");

console.log("Third");`;
    expect(result.code).toBe(expected);
    expect(result.position).toStrictEqual(new Position(4, 0));
  });

  it("should set editor cursor at moved statement new position (move down function at next line)", async () => {
    const code = `console.log("First");
function doSomething() {
  console.log("Second");
}`;
    const selection = Selection.cursorAt(0, 0);

    const result = await doMoveStatementDown(code, selection);

    const expected = `function doSomething() {
  console.log("Second");
}

console.log("First");`;
    expect(result.code).toBe(expected);
    expect(result.position).toStrictEqual(new Position(4, 0));
  });

  it("should set editor cursor at moved statement new position (move down function at a further line)", async () => {
    const code = `console.log("First");

function doSomething() {
  console.log("Second");
}`;
    const selection = Selection.cursorAt(0, 0);

    const result = await doMoveStatementDown(code, selection);

    const expected = `function doSomething() {
  console.log("Second");
}

console.log("First");`;
    expect(result.code).toBe(expected);
    expect(result.position).toStrictEqual(new Position(4, 0));
  });

  it("should set editor cursor at moved statement new position (move down function at a further line + statement before)", async () => {
    const code = `console.log("First");
console.log("Second");

function doSomething() {
  console.log("Third");
}`;
    const selection = Selection.cursorAt(1, 0);

    const result = await doMoveStatementDown(code, selection);

    const expected = `console.log("First");

function doSomething() {
  console.log("Third");
}

console.log("Second");`;
    expect(result.code).toBe(expected);
    expect(result.position).toStrictEqual(new Position(6, 0));
  });

  it("should set editor cursor at moved statement new position (move down function at next line + statement before)", async () => {
    const code = `console.log("First");
console.log("Second");
function doSomething() {
  console.log("Third");
}`;
    const selection = Selection.cursorAt(1, 0);

    const result = await doMoveStatementDown(code, selection);

    const expected = `console.log("First");

function doSomething() {
  console.log("Third");
}

console.log("Second");`;
    expect(result.code).toBe(expected);
    expect(result.position).toStrictEqual(new Position(6, 0));
  });

  it("should do nothing, nor show an error message if selected statement is at the bottom of the file", async () => {
    const code = `console.log(
  "nothing below this statement"
)`;
    const selection = Selection.cursorAt(0, 0);

    const result = await doMoveStatementDown(code, selection);

    expect(result.code).toBe(code);
    expect(showErrorMessage).not.toBeCalled();
  });

  it("should show an error message for multi-lines selections", async () => {
    const code = `console.log("First");
console.log("Second");
console.log("Third")`;
    const selection = new Selection([1, 0], [2, 0]);

    await doMoveStatementDown(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.CantMoveMultiLinesStatementDown
    );
  });

  it("should show an error message if selection is invalid", async () => {
    const code = `console.log("First");`;
    const invalidSelection = Selection.cursorAt(2, 0);

    await doMoveStatementDown(code, invalidSelection);

    expect(showErrorMessage).toBeCalledWith(ErrorReason.CantMoveStatementDown);
  });

  async function doMoveStatementDown(
    code: Code,
    selection: Selection
  ): Promise<{ code: Code; position: Position }> {
    const [write, getState] = createWriteInMemory(code);
    await moveStatementDown(code, selection, write, showErrorMessage);
    return getState();
  }
});
