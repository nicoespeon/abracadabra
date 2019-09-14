import { Selection } from "../../editor/selection";
import { Update } from "../../editor/editor";

import { InlinableCode, InlinableObjectPattern } from "./find-inlinable-code";

const ANY_SELECTION = Selection.cursorAt(0, 0);

class FakeInlinable implements InlinableCode {
  isRedeclared = false;
  isExported = false;
  hasIdentifiersToUpdate = false;
  selection = ANY_SELECTION;
  codeToRemoveSelection = ANY_SELECTION;

  private updates: Update[];

  constructor(updates: Update[] = []) {
    this.updates = updates;
  }

  updateIdentifiersWith = () => this.updates;
}

describe("InlinableObjectPattern", () => {
  it("should return child code updates", () => {
    const updates = [
      {
        code: "userId",
        selection: ANY_SELECTION
      },
      {
        code: "player.state",
        selection: ANY_SELECTION
      }
    ];
    const inlinable = new InlinableObjectPattern(
      new FakeInlinable(updates),
      ""
    );

    const result = inlinable.updateIdentifiersWith("");

    expect(result).toEqual(updates);
  });

  it("should prepend inlined code with init name before forwarding it to child", () => {
    const child = new FakeInlinable();
    jest.spyOn(child, "updateIdentifiersWith");
    const inlinable = new InlinableObjectPattern(child, "user");

    inlinable.updateIdentifiersWith("name");

    expect(child.updateIdentifiersWith).toBeCalledWith("user.name");
  });

  it("should resolve inlined code path if inlined code is already a member expression", () => {
    const child = new FakeInlinable();
    jest.spyOn(child, "updateIdentifiersWith");
    const inlinable = new InlinableObjectPattern(child, "names");

    inlinable.updateIdentifiersWith("user.first");

    expect(child.updateIdentifiersWith).toBeCalledWith("user.names.first");
  });

  it("should resolve inlined code path if inlined code is an object property", () => {
    const child = new FakeInlinable();
    jest.spyOn(child, "updateIdentifiersWith");
    const inlinable = new InlinableObjectPattern(child, "user");

    inlinable.updateIdentifiersWith("n: name");

    expect(child.updateIdentifiersWith).toBeCalledWith("user.n");
  });
});
