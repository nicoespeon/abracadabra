import { Code } from "./i-write-code";
import { flipTernary } from "./flip-ternary";
import { Selection } from "./selection";
import { ShowErrorMessage, ErrorReason } from "./i-show-error-message";
import { createWriteInMemory } from "./adapters/write-code-in-memory";

describe("Flip Ternary", () => {
  let showErrorMessage: ShowErrorMessage;

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  it.each<[string, { code: Code; selection: Selection; expected: Code }]>([
    [
      "basic scenario",
      {
        code: `const hello = isMorning ? "Good morning" : "Hello";`,
        selection: Selection.cursorAt(0, 16),
        expected: `const hello = !isMorning ? "Hello" : "Good morning";`
      }
    ],
    [
      "an already flipped ternary",
      {
        code: `const hello = !isMorning ? "Hello" : "Good morning";`,
        selection: Selection.cursorAt(0, 16),
        expected: `const hello = isMorning ? "Good morning" : "Hello";`
      }
    ],
    [
      "a ternary with a binary expression",
      {
        code: `const max = a > b ? a : b;`,
        selection: Selection.cursorAt(0, 16),
        expected: `const max = a <= b ? b : a;`
      }
    ]
  ])("should flip ternary (%s)", async (_, { code, selection, expected }) => {
    const result = await doFlipTernary(code, selection);

    expect(result).toBe(expected);
  });

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
    const [write, getCode] = createWriteInMemory(code);
    await flipTernary(code, selection, write, showErrorMessage);
    return getCode();
  }
});
