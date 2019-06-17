import { Write, Code } from "./i-update-code";
import { removeRedundantElse } from "./remove-redundant-else";
import { Selection } from "./selection";
import { ShowErrorMessage, ErrorReason } from "./i-show-error-message";

describe("Negate Expression", () => {
  let showErrorMessage: ShowErrorMessage;
  let write: Write;

  beforeEach(() => {
    showErrorMessage = jest.fn();
    write = jest.fn();
  });

  it("should remove redundant else", async () => {
    const code = `function doSomethingIfValid() {
  if (!isValid) {
    showWarning();
    return;
  } else {
    doSomething();
    doAnotherThing();
  }
}`;
    const selection = new Selection([1, 3], [7, 3]);

    await doRemoveRedundantElse(code, selection);

    expect(write).toBeCalledWith([
      {
        code: `{
  if (!isValid) {
    showWarning();
    return;
  }

  doSomething();
  doAnotherThing();
}`,
        selection: new Selection([0, 30], [8, 1])
      }
    ]);
  });

  it("should show an error message if selection has no redundant else", async () => {
    const code = `if (!isValid) {
  showWarning();
} else {
  doSomething();
  doAnotherThing();
}`;
    const selection = new Selection([0, 0], [5, 1]);

    await doRemoveRedundantElse(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundRedundantElse
    );
  });

  async function doRemoveRedundantElse(code: Code, selection: Selection) {
    return await removeRedundantElse(code, selection, write, showErrorMessage);
  }
});
