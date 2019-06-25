import { Code } from "./editor/i-write-code";
import { Selection } from "./editor/selection";
import { ShowErrorMessage, ErrorReason } from "./editor/i-show-error-message";
import { createWriteInMemory } from "./adapters/write-code-in-memory";
import { convertTernaryToIfElse } from "./convert-ternary-to-if-else";

describe("Convert Ternary to If/Else", () => {
  let showErrorMessage: ShowErrorMessage;

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  it.each<[string, { code: Code; selection: Selection; expected: Code }]>([
    [
      "return statement",
      {
        code: `function reservationMode(daysInAdvance) {
  return daysInAdvance > 10 ? "early" : "normal";
}`,
        selection: Selection.cursorAt(1, 16),
        expected: `function reservationMode(daysInAdvance) {
  if (daysInAdvance > 10) {
    return "early";
  } else {
    return "normal";
  }
}`
      }
    ],
    [
      "assignment expression",
      {
        code: `function reservationMode(daysInAdvance) {
  let mode;
  mode = daysInAdvance > 10 ? "early" : "normal";
  return mode;
}`,
        selection: Selection.cursorAt(2, 16),
        expected: `function reservationMode(daysInAdvance) {
  let mode;

  if (daysInAdvance > 10) {
    mode = "early";
  } else {
    mode = "normal";
  }

  return mode;
}`
      }
    ],
    [
      "variable declaration",
      {
        code: `function reservationMode(daysInAdvance) {
  const mode = daysInAdvance > 10 ? "early" : "normal";
  return mode;
}`,
        selection: Selection.cursorAt(1, 16),
        expected: `function reservationMode(daysInAdvance) {
  let mode;

  if (daysInAdvance > 10) {
    mode = "early";
  } else {
    mode = "normal";
  }

  return mode;
}`
      }
    ],
    [
      "nested ternary, cursor on wrapping ternary",
      {
        code: `function reservationMode(daysInAdvance) {
  return daysInAdvance > 10 ? "early" : isVIP ? "vip" : "normal";
}`,
        selection: Selection.cursorAt(1, 16),
        expected: `function reservationMode(daysInAdvance) {
  if (daysInAdvance > 10) {
    return "early";
  } else {
    return isVIP ? "vip" : "normal";
  }
}`
      }
    ]
  ])(
    "should convert ternary to if/else (%s)",
    async (_, { code, selection, expected }) => {
      const result = await doConvertTernaryToIfElse(code, selection);

      expect(result).toBe(expected);
    }
  );

  it("should show an error message if selection has no valid ternary to convert", async () => {
    const code = `console.log("no ternary")`;
    const selection = Selection.cursorAt(0, 0);

    await doConvertTernaryToIfElse(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundTernaryToConvert
    );
  });

  async function doConvertTernaryToIfElse(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const [write, getCode] = createWriteInMemory(code);
    await convertTernaryToIfElse(code, selection, write, showErrorMessage);
    return getCode();
  }
});
