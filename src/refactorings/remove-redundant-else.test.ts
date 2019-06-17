import { UpdateWith, Update, Code } from "./i-update-code";
import { removeRedundantElse } from "./remove-redundant-else";
import { Selection } from "./selection";
import { ShowErrorMessage, ErrorReason } from "./i-show-error-message";

describe("Negate Expression", () => {
  let showErrorMessage: ShowErrorMessage;
  let updateWith: UpdateWith;
  let updates: Update[] = [];
  let updatedExpression = "";

  beforeEach(() => {
    showErrorMessage = jest.fn();
    updates = [];
    updatedExpression = "";
    updateWith = jest
      .fn()
      .mockImplementation(
        (_, getUpdates) => (updates = getUpdates(updatedExpression))
      );
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
    updatedExpression = `if (!isValid) {
  showWarning();
  return;
} else {
  doSomething();
  doAnotherThing();
}`;

    await doRemoveRedundantElse(code, selection);

    expect(updates).toEqual([
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
    return await removeRedundantElse(
      code,
      selection,
      updateWith,
      showErrorMessage
    );
  }
});
