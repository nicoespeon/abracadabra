import { Code } from "../../editor/i-write-code";
import { Selection } from "../../editor/selection";
import {
  ShowErrorMessage,
  ErrorReason
} from "../../editor/i-show-error-message";
import { createWriteInMemory } from "../../editor/adapters/write-code-in-memory";
import { removeBracesFromArrowFunction } from "./remove-braces-from-arrow-function";
import { testEach } from "../../tests-helpers";

describe("Remove Braces from Arrow Function", () => {
  let showErrorMessage: ShowErrorMessage;

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; selection: Selection; expected: Code }>(
    "should remove braces from arrow function",
    [
      {
        description: "basic scenario",
        code: `const sayHello = () => {
  return "Hello!";
};`,
        selection: Selection.cursorAt(1, 2),
        expected: `const sayHello = () => "Hello!";`
      },
      {
        description: "nested arrow function, cursor on wrapper",
        code: `const createSayHello = () => {
  return () => {
    return "Hello!";
  }
};`,
        selection: Selection.cursorAt(1, 2),
        expected: `const createSayHello = () => () => {
  return "Hello!";
};`
      },
      {
        description: "nested arrow function, cursor on nested",
        code: `const createSayHello = () => {
  return () => {
    return "Hello!";
  }
};`,
        selection: Selection.cursorAt(2, 4),
        expected: `const createSayHello = () => {
  return () => "Hello!";
};`
      }
    ],
    async ({ code, selection, expected }) => {
      const result = await doRemoveBracesFromArrowFunction(code, selection);

      expect(result).toBe(expected);
    }
  );

  it("should throw an error if can't find an arrow function", async () => {
    const code = `function getTotal() {
  return fees * 10;
}`;
    const selection = Selection.cursorAt(1, 2);

    await doRemoveBracesFromArrowFunction(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundBracesToRemoveFromArrowFunction
    );
  });

  it("should throw an error if arrow function doesn't have braces", async () => {
    const code = `const sayHello = () => "Hello!";`;
    const selection = Selection.cursorAt(0, 25);

    await doRemoveBracesFromArrowFunction(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundBracesToRemoveFromArrowFunction
    );
  });

  it("should throw an error if arrow function returns nothing", async () => {
    const code = `const sayHello = () => {
  return;
}`;
    const selection = Selection.cursorAt(1, 2);

    await doRemoveBracesFromArrowFunction(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.CantRemoveBracesFromArrowFunction
    );
  });

  it("should throw an error if arrow function doesn't return", async () => {
    const code = `const sayHello = () => {
  console.log("Hello!");
}`;
    const selection = Selection.cursorAt(1, 2);

    await doRemoveBracesFromArrowFunction(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.CantRemoveBracesFromArrowFunction
    );
  });

  it("should throw an error if arrow function have statements before the return statement", async () => {
    const code = `const sayHello = () => {
  const hello = "Hello!";
  return hello;
}`;
    const selection = Selection.cursorAt(1, 2);

    await doRemoveBracesFromArrowFunction(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.CantRemoveBracesFromArrowFunction
    );
  });

  it("should throw an error if arrow function have statements after the return statement", async () => {
    const code = `const sayHello = () => {
  return "Hello!";
  console.log("Some dead code");
}`;
    const selection = Selection.cursorAt(1, 2);

    await doRemoveBracesFromArrowFunction(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.CantRemoveBracesFromArrowFunction
    );
  });

  async function doRemoveBracesFromArrowFunction(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const [write, getState] = createWriteInMemory(code);
    await removeBracesFromArrowFunction(
      code,
      selection,
      write,
      showErrorMessage
    );
    return getState().code;
  }
});
