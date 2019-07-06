import { Code } from "./editor/i-write-code";
import { Selection } from "./editor/selection";
import { Position } from "./editor/position";
import { ShowErrorMessage, ErrorReason } from "./editor/i-show-error-message";
import { createWriteInMemory } from "./adapters/write-code-in-memory";
import { moveStatementUp } from "./move-statement-up";

describe("Move Statement Up", () => {
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
        selection: Selection.cursorAt(1, 0),
        expected: `console.log("I'm down");
console.log("I'm up");`
      }
    ],
    [
      "multi-lines statement",
      {
        code: `console.log("I'm up");

if (isValid) {
  console.log("I'm down");
}`,
        selection: Selection.cursorAt(2, 0),
        expected: `if (isValid) {
  console.log("I'm down");
}

console.log("I'm up");`
      }
    ],
    [
      "single-line statement moved above multi-lines statement",
      {
        code: `if (isValid) {
  console.log("I'm up");
}

console.log("I'm down");`,
        selection: Selection.cursorAt(4, 0),
        expected: `console.log("I'm down");

if (isValid) {
  console.log("I'm up");
}`
      }
    ],
    [
      "multi-lines statement moved above multi-lines statement",
      {
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
}`
      }
      // TODO: These statements need to be fixed
      //     ],
      //     [
      //       "statement inside a container",
      //       {
      //         code: `if (isVIP) {
      //   console.log("I shouldn't move");
      // }
      // if (isValid) {
      //   console.log("I'm up");
      //   console.log("I'm down");
      // }`,
      //         selection: Selection.cursorAt(4, 2),
      //         expected: `if (isVIP) {
      //   console.log("I shouldn't move");
      // }
      // if (isValid) {
      //   console.log("I'm down");
      //   console.log("I'm up");
      // }`
      //       }
      //     ],
      //     [
      //       "statement inside a container, cursor at start of line",
      //       {
      //         code: `if (isVIP) {
      //   console.log("I shouldn't move");
      // }
      // if (isValid) {
      //   console.log("I'm up");
      //   console.log("I'm down");
      // }`,
      //         selection: Selection.cursorAt(4, 0),
      //         expected: `if (isVIP) {
      //   console.log("I shouldn't move");
      // }
      // if (isValid) {
      //   console.log("I'm down");
      //   console.log("I'm up");
      // }
      // if (isVIP) {
      //   console.log("I shouldn't move");
      // }`
      //       }
    ]
  ])(
    "should move statement up (%s)",
    async (_, { code, selection, expected }) => {
      const result = await doMoveStatementUp(code, selection);

      expect(result.code).toBe(expected);
    }
  );

  it("should set editor cursor at moved statement new position", async () => {
    const code = `if (isValid) {
  console.log("First");
  console.log("Second");
  console.log("Third");
}`;
    const selection = Selection.cursorAt(3, 5);

    const result = await doMoveStatementUp(code, selection);

    expect(result.position).toStrictEqual(new Position(2, 5));
  });

  it("should set editor cursor at moved statement new position (multi-lines)", async () => {
    const code = `console.log("First");

function doSomething() {
  console.log("Second");
}

console.log("Third");`;
    const selection = Selection.cursorAt(6, 0);

    const result = await doMoveStatementUp(code, selection);

    const expected = `console.log("First");

console.log("Third");

function doSomething() {
  console.log("Second");
}`;
    expect(result.code).toBe(expected);
    expect(result.position).toStrictEqual(new Position(2, 0));
  });

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
