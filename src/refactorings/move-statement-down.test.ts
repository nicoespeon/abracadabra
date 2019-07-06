import { Code } from "./editor/i-write-code";
import { Selection } from "./editor/selection";
import { Position } from "./editor/position";
import { ShowErrorMessage, ErrorReason } from "./editor/i-show-error-message";
import { PutCursorAt } from "./editor/i-put-cursor-at";
import { createWriteInMemory } from "./adapters/write-code-in-memory";
import { moveStatementDown } from "./move-statement-down";

describe("Move Statement Down", () => {
  let showErrorMessage: ShowErrorMessage;
  let putCursorAt: PutCursorAt;

  beforeEach(() => {
    showErrorMessage = jest.fn();
    putCursorAt = jest.fn();
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
      // TODO: These statements need to be fixed
      //     ],
      //     [
      //       "statement inside a container",
      //       {
      //         code: `if (isValid) {
      //   console.log("I'm up");
      //   console.log("I'm down");
      // }
      // if (isVIP) {
      //   console.log("I shouldn't move");
      // }`,
      //         selection: Selection.cursorAt(1, 2),
      //         expected: `if (isValid) {
      //   console.log("I'm down");
      //   console.log("I'm up");
      // }
      // if (isVIP) {
      //   console.log("I shouldn't move");
      // }`
      //       }
      //     ],
      //     [
      //       "statement inside a container, cursor at start of line",
      //       {
      //         code: `if (isValid) {
      //   console.log("I'm up");
      //   console.log("I'm down");
      // }
      // if (isVIP) {
      //   console.log("I shouldn't move");
      // }`,
      //         selection: Selection.cursorAt(1, 0),
      //         expected: `if (isValid) {
      //   console.log("I'm down");
      //   console.log("I'm up");
      // }
      // if (isVIP) {
      //   console.log("I shouldn't move");
      // }`
      //       }
    ]
  ])(
    "should move statement down (%s)",
    async (_, { code, selection, expected }) => {
      const result = await doMoveStatementDown(code, selection);

      expect(result).toBe(expected);
    }
  );

  it("should set editor cursor at moved statement new position", async () => {
    const code = `if (isValid) {
  console.log("First");
  console.log("Second");
  console.log("Third");
}`;
    const selection = Selection.cursorAt(1, 5);

    await doMoveStatementDown(code, selection);

    expect(putCursorAt).toBeCalledWith(new Position(2, 5));
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
    expect(result).toBe(expected);
    expect(putCursorAt).toBeCalledWith(new Position(4, 0));
  });

  it("should do nothing, nor show an error message if selected statement is at the bottom of the file", async () => {
    const code = `console.log(
  "nothing below this statement"
)`;
    const selection = Selection.cursorAt(0, 0);

    const result = await doMoveStatementDown(code, selection);

    expect(result).toBe(code);
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
  ): Promise<Code> {
    const [write, getCode] = createWriteInMemory(code);
    await moveStatementDown(
      code,
      selection,
      write,
      showErrorMessage,
      putCursorAt
    );
    return getCode();
  }
});
