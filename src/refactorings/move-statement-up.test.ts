import { Code } from "./editor/i-write-code";
import { Selection } from "./editor/selection";
import { Position } from "./editor/position";
import { ShowErrorMessage, ErrorReason } from "./editor/i-show-error-message";
import { createWriteInMemory } from "./editor/adapters/write-code-in-memory";
import { moveStatementUp } from "./move-statement-up";
import { testEach } from "../tests-helpers";

describe("Move Statement Up", () => {
  let showErrorMessage: ShowErrorMessage;

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
    const [write, getState] = createWriteInMemory(code);
    await moveStatementUp(code, selection, write, showErrorMessage);
    return getState();
  }
});
