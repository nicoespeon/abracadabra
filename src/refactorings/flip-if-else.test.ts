import { Code } from "./editor/i-write-code";
import { Selection } from "./editor/selection";
import { ShowErrorMessage, ErrorReason } from "./editor/i-show-error-message";
import { createWriteInMemory } from "./adapters/write-code-in-memory";
import { flipIfElse } from "./flip-if-else";

describe("Flip If/Else", () => {
  let showErrorMessage: ShowErrorMessage;

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  it.each<[string, { code: Code; expected: Code }]>([
    [
      "basic scenario",
      {
        code: `if (isValid) {
  doSomething();
} else {
  doAnotherThing();
}`,
        expected: `if (!isValid) {
  doAnotherThing();
} else {
  doSomething();
}`
      }
    ],
    [
      "else branch doesn't exist yet",
      {
        code: `if (isValid) {
  doSomething();
}`,
        expected: `if (!isValid) {} else {
  doSomething();
}`
      }
    ],
    [
      "an already flipped if statement",
      {
        code: `if (!isValid) {
  doAnotherThing();
} else {
  doSomething();
}`,
        expected: `if (isValid) {
  doSomething();
} else {
  doAnotherThing();
}`
      }
    ],
    [
      "an if statement with a binary expression",
      {
        code: `if (a > b) {
  doAnotherThing();
} else {
  doSomething();
}`,
        expected: `if (a <= b) {
  doSomething();
} else {
  doAnotherThing();
}`
      }
    ]
  ])("should flip if and else branch (%s)", async (_, { code, expected }) => {
    const selection = Selection.cursorAt(0, 0);

    const result = await doFlipIfElse(code, selection);

    expect(result).toBe(expected);
  });

  it("should show an error message if selection has no if statement", async () => {
    const code = `console.log("no if statement")`;
    const selection = Selection.cursorAt(0, 0);

    await doFlipIfElse(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundIfElseToFlip
    );
  });

  async function doFlipIfElse(code: Code, selection: Selection): Promise<Code> {
    const [write, getState] = createWriteInMemory(code);
    await flipIfElse(code, selection, write, showErrorMessage);
    return getState().code;
  }
});
