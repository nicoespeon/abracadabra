import { Code } from "../../editor/i-write-code";
import { Selection } from "../../editor/selection";
import {
  ShowErrorMessage,
  ErrorReason
} from "../../editor/i-show-error-message";
import { createWriteInMemory } from "../../editor/adapters/write-code-in-memory";
import { splitDeclarationAndInitialization } from "./split-declaration-and-initialization";
import { testEach } from "../../tests-helpers";

describe("Split Declaration and Initialization", () => {
  let showErrorMessage: ShowErrorMessage;

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; selection?: Selection; expected: Code }>(
    "should split declaration and initialization",
    [
      {
        description: "basic const assignment",
        code: `const firstName = "Jane";`,
        expected: `let firstName;
firstName = "Jane";`
      },
      {
        description: "basic var assignment",
        code: `var firstName = "Jane";`,
        expected: `let firstName;
firstName = "Jane";`
      },
      {
        description: "assignment to null",
        code: `const firstName = null;`,
        expected: `let firstName;
firstName = null;`
      },
      {
        description: "the selected assignment",
        code: `const firstName = "Jane";
const lastName = "Doe";`,
        expected: `let firstName;
firstName = "Jane";
const lastName = "Doe";`
      },
      {
        description: "multi-lines assignment (selection in the middle)",
        code: `const firstName =
  "Jane";`,
        selection: Selection.cursorAt(1, 2),
        expected: `let firstName;
firstName = "Jane";`
      },
      {
        description: "multiple declarations",
        code: `const firstName = "Jane", lastName = "Doe";`,
        expected: `let firstName, lastName;
firstName = "Jane";
lastName = "Doe";`
      }
    ],
    async ({ code, selection = Selection.cursorAt(0, 0), expected }) => {
      const result = await doSplitDeclarationAndInitialization(code, selection);

      expect(result).toBe(expected);
    }
  );

  it("should throw an error if there is nothing to split", async () => {
    const code = `passengersCount = 1;`;
    const selection = Selection.cursorAt(0, 4);

    await doSplitDeclarationAndInitialization(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundDeclarationToSplit
    );
  });

  async function doSplitDeclarationAndInitialization(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const [write, getState] = createWriteInMemory(code);
    await splitDeclarationAndInitialization(
      code,
      selection,
      write,
      showErrorMessage
    );
    return getState().code;
  }
});
