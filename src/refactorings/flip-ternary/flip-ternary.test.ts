import { Code } from "../../editor/i-write-code";
import { Selection } from "../../editor/selection";
import {
  ShowErrorMessage,
  ErrorReason
} from "../../editor/i-show-error-message";
import { createWriteInMemory } from "../../editor/adapters/write-code-in-memory";
import { flipTernary } from "./flip-ternary";
import { testEach } from "../../tests-helpers";

describe("Flip Ternary", () => {
  let showErrorMessage: ShowErrorMessage;

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; selection: Selection; expected: Code }>(
    "should flip ternary",
    [
      {
        description: "basic scenario",
        code: `const hello = isMorning ? "Good morning" : "Hello";`,
        selection: Selection.cursorAt(0, 16),
        expected: `const hello = !isMorning ? "Hello" : "Good morning";`
      },
      {
        description: "an already flipped ternary",
        code: `const hello = !isMorning ? "Hello" : "Good morning";`,
        selection: Selection.cursorAt(0, 16),
        expected: `const hello = isMorning ? "Good morning" : "Hello";`
      },
      {
        description: "a ternary with a binary expression",
        code: `const max = a > b ? a : b;`,
        selection: Selection.cursorAt(0, 16),
        expected: `const max = a <= b ? b : a;`
      },
      {
        description: "nested, cursor on wrapper",
        code: `const hello = isMorning
  ? isMonday ? "Good monday morning!" : "Good morning"
  : "Hello";`,
        selection: Selection.cursorAt(0, 16),
        expected: `const hello = !isMorning
  ? "Hello"
  : isMonday ? "Good monday morning!" : "Good morning";`
      },
      {
        description: "nested, cursor on nested",
        code: `const hello = isMorning
  ? isMonday ? "Good monday morning!" : "Good morning"
  : "Hello";`,
        selection: Selection.cursorAt(1, 4),
        expected: `const hello = isMorning
  ? !isMonday ? "Good morning" : "Good monday morning!"
  : "Hello";`
      }
    ],
    async ({ code, selection, expected }) => {
      const result = await doFlipTernary(code, selection);

      expect(result).toBe(expected);
    }
  );

  it("should show an error message if selection has no ternary", async () => {
    const code = `console.log("no ternary")`;
    const selection = Selection.cursorAt(0, 0);

    await doFlipTernary(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundTernaryToFlip
    );
  });

  async function doFlipTernary(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const [write, getState] = createWriteInMemory(code);
    await flipTernary(code, selection, write, showErrorMessage);
    return getState().code;
  }
});
