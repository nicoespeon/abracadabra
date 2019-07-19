import { Code } from "../../editor/i-write-code";
import { Selection } from "../../editor/selection";
import {
  ShowErrorMessage,
  ErrorReason
} from "../../editor/i-show-error-message";
import { createWriteInMemory } from "../../editor/adapters/write-code-in-memory";
import { addBracesToArrowFunction } from "./add-braces-to-arrow-function";
import { testEach } from "../../tests-helpers";

describe("Add Braces to Arrow Function", () => {
  let showErrorMessage: ShowErrorMessage;

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; selection: Selection; expected: Code }>(
    "should add braces to arrow function",
    [
      {
        description: "basic scenario",
        code: `const sayHello = () => "Hello!";`,
        selection: Selection.cursorAt(0, 17),
        expected: `const sayHello = () => {
  return "Hello!";
};`
      },
      {
        description: "nested arrow function, cursor on wrapper",
        code: `const createSayHello = () => () => "Hello!";`,
        selection: Selection.cursorAt(0, 23),
        expected: `const createSayHello = () => {
  return () => "Hello!";
};`
      },
      {
        description: "nested arrow function, cursor on nested",
        code: `const createSayHello = () => () => "Hello!";`,
        selection: Selection.cursorAt(0, 29),
        expected: `const createSayHello = () => () => {
  return "Hello!";
};`
      }
    ],
    async ({ code, selection, expected }) => {
      const result = await doAddBracesToArrowFunction(code, selection);

      expect(result).toBe(expected);
    }
  );

  it("should throw an error if can't find an arrow function", async () => {
    const code = `function getTotal() {
  return fees * 10;
}`;
    const selection = Selection.cursorAt(1, 2);

    await doAddBracesToArrowFunction(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundArrowFunctionToAddBraces
    );
  });

  it("should throw an error if arrow function already has braces", async () => {
    const code = `const sayHello = () => {
  return "Hello!";
}`;
    const selection = Selection.cursorAt(1, 2);

    await doAddBracesToArrowFunction(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundArrowFunctionToAddBraces
    );
  });

  async function doAddBracesToArrowFunction(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const [write, getState] = createWriteInMemory(code);
    await addBracesToArrowFunction(code, selection, write, showErrorMessage);
    return getState().code;
  }
});
