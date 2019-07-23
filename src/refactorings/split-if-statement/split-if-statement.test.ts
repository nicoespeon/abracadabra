import { Code } from "../../editor/i-write-code";
import { Selection } from "../../editor/selection";
import {
  ShowErrorMessage,
  ErrorReason
} from "../../editor/i-show-error-message";
import { createWriteInMemory } from "../../editor/adapters/write-code-in-memory";
import { splitIfStatement } from "./split-if-statement";
import { testEach } from "../../tests-helpers";

describe("Split If Statement", () => {
  let showErrorMessage: ShowErrorMessage;

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; expected: Code }>(
    "should split if statement",
    [
      {
        description: "with && logical expression",
        code: `if (isValid && isCorrect) {
  doSomething();
}`,
        expected: `if (isValid) {
  if (isCorrect) {
    doSomething();
  }
}`
      }
    ],
    async ({ code, expected }) => {
      const selection = Selection.cursorAt(0, 0);

      const result = await doSplitIfStatement(code, selection);

      expect(result).toBe(expected);
    }
  );

  it("should throw an error if logical expression can't be split", async () => {
    const code = `if (isValid) {}`;
    const selection = Selection.cursorAt(0, 4);

    await doSplitIfStatement(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundIfStatementToSplit
    );
  });

  it("should throw an error if logical expression is not in if statement", async () => {
    const code = `const isValid = size > 10 && isRequired;`;
    const selection = Selection.cursorAt(0, 27);

    await doSplitIfStatement(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundIfStatementToSplit
    );
  });

  async function doSplitIfStatement(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const [write, getState] = createWriteInMemory(code);
    await splitIfStatement(code, selection, write, showErrorMessage);
    return getState().code;
  }
});
