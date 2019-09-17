import * as ast from "../../ast";

import { Selection } from "../../editor/selection";
import { Update } from "../../editor/editor";

import { InlinableCode, InlinableObjectPattern } from "./find-inlinable-code";

const ANY_SELECTION = Selection.cursorAt(0, 0);
const ANY_LOC: ast.SourceLocation = {
  start: { line: 0, column: 0 },
  end: { line: 0, column: 0 }
};

class FakeInlinable implements InlinableCode {
  isRedeclared = false;
  isExported = false;
  hasIdentifiersToUpdate = false;
  valueSelection = ANY_SELECTION;
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
      "",
      ANY_LOC
    );

    const result = inlinable.updateIdentifiersWith("");

    expect(result).toEqual(updates);
  });

  it("should prepend inlined code with init name before forwarding it to child", () => {
    const child = new FakeInlinable();
    jest.spyOn(child, "updateIdentifiersWith");
    const inlinable = new InlinableObjectPattern(child, "user", ANY_LOC);

    inlinable.updateIdentifiersWith("name");

    expect(child.updateIdentifiersWith).toBeCalledWith("user.name");
  });

  it("should resolve inlined code path if inlined code is already a member expression", () => {
    const child = new FakeInlinable();
    jest.spyOn(child, "updateIdentifiersWith");
    const inlinable = new InlinableObjectPattern(child, "names", ANY_LOC);

    inlinable.updateIdentifiersWith("user.first");

    expect(child.updateIdentifiersWith).toBeCalledWith("user.names.first");
  });

  it("should resolve inlined code path if inlined code is an object property", () => {
    const child = new FakeInlinable();
    jest.spyOn(child, "updateIdentifiersWith");
    const inlinable = new InlinableObjectPattern(child, "user", ANY_LOC);

    inlinable.updateIdentifiersWith("n: name");

    expect(child.updateIdentifiersWith).toBeCalledWith("user.n");
  });

  it("should resolve inlined code path if inlined code is a complex member expression", () => {
    const child = new FakeInlinable();
    jest.spyOn(child, "updateIdentifiersWith");
    const inlinable = new InlinableObjectPattern(child, "user", ANY_LOC);

    inlinable.updateIdentifiersWith("session.data[0].first");

    expect(child.updateIdentifiersWith).toBeCalledWith(
      "session.data[0].user.first"
    );
  });
});
