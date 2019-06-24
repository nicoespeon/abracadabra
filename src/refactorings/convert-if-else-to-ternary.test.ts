import { Code } from "./i-write-code";
import { convertIfElseToTernary } from "./convert-if-else-to-ternary";
import { Selection } from "./selection";
import { ShowErrorMessage, ErrorReason } from "./i-show-error-message";
import { createWriteInMemory } from "./adapters/write-code-in-memory";

describe("Convert If/Else to Ternary", () => {
  let showErrorMessage: ShowErrorMessage;

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  it.each<[string, { code: Code; selection: Selection; expected: Code }]>([
    [
      "with a return value",
      {
        code: `function reservationMode(daysInAdvance) {
  if (daysInAdvance > 10) {
    return "early";
  } else {
    return "normal"
  }
}`,
        selection: Selection.cursorAt(1, 6),
        expected: `function reservationMode(daysInAdvance) {
  return daysInAdvance > 10 ? "early" : "normal";
}`
      }
    ],
    [
      "with an assignment",
      {
        code: `function reservationMode(daysInAdvance) {
  let mode;
  if (daysInAdvance > 10) {
    mode = "early";
  } else {
    mode = "normal"
  }
  return \`reserve-\${mode}\`;
}`,
        selection: Selection.cursorAt(2, 6),
        expected: `function reservationMode(daysInAdvance) {
  let mode;
  mode = daysInAdvance > 10 ? "early" : "normal";
  return \`reserve-\${mode}\`;
}`
      }
    ]
  ])(
    "should convert if/else to ternary (%s)",
    async (_, { code, selection, expected }) => {
      const result = await doConvertIfElseToTernary(code, selection);

      expect(result).toBe(expected);
    }
  );

  it("should show an error message if selection has no valid if/else to convert", async () => {
    const code = `console.log("no if/else")`;
    const selection = Selection.cursorAt(0, 0);

    await doConvertIfElseToTernary(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundIfElseToConvert
    );
  });

  async function doConvertIfElseToTernary(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const [write, getCode] = createWriteInMemory(code);
    await convertIfElseToTernary(code, selection, write, showErrorMessage);
    return getCode();
  }
});
