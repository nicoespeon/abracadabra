import * as ast from "../../ast";

import { Selection } from "../../editor/selection";
import { Update } from "../../editor/editor";

import { InlinableCode, InlinableObjectPattern } from "./find-inlinable-code";

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
    const inlinable = createInlinableObjectPattern(
      new FakeInlinable(updates),
      ""
    );

    const result = inlinable.updateIdentifiersWith("");

    expect(result).toEqual(updates);
  });

  it("should prepend inlined code with init name before forwarding it to child", () => {
    const child = new FakeInlinable();
    jest.spyOn(child, "updateIdentifiersWith");
    const inlinable = createInlinableObjectPattern(child, "user");

    inlinable.updateIdentifiersWith("name");

    expect(child.updateIdentifiersWith).toBeCalledWith("user.name");
  });

  it("should resolve inlined code path if inlined code is already a member expression", () => {
    const child = new FakeInlinable();
    jest.spyOn(child, "updateIdentifiersWith");
    const inlinable = createInlinableObjectPattern(child, "names");

    inlinable.updateIdentifiersWith("user.first");

    expect(child.updateIdentifiersWith).toBeCalledWith("user.names.first");
  });

  it("should resolve inlined code path if inlined code is an object property", () => {
    const child = new FakeInlinable();
    jest.spyOn(child, "updateIdentifiersWith");
    const inlinable = createInlinableObjectPattern(child, "user");

    inlinable.updateIdentifiersWith("n: name");

    expect(child.updateIdentifiersWith).toBeCalledWith("user.n");
  });

  it("should resolve inlined code path if inlined code is a complex member expression", () => {
    const child = new FakeInlinable();
    jest.spyOn(child, "updateIdentifiersWith");
    const inlinable = createInlinableObjectPattern(child, "user");

    inlinable.updateIdentifiersWith("session.data[0].first");

    expect(child.updateIdentifiersWith).toBeCalledWith(
      "session.data[0].user.first"
    );
  });
});

const ANY_SELECTION = Selection.cursorAt(0, 0);

class FakeInlinable implements InlinableCode {
  isRedeclared = false;
  isExported = false;
  hasIdentifiersToUpdate = false;
  shouldExtendSelectionToDeclaration = false;
  valueSelection = ANY_SELECTION;
  codeToRemoveSelection = ANY_SELECTION;

  private updates: Update[];

  constructor(updates: Update[] = []) {
    this.updates = updates;
  }

  updateIdentifiersWith = () => this.updates;
}

function createInlinableObjectPattern(child: InlinableCode, initName: string) {
  const ANY_LOC: ast.SourceLocation = {
    start: { line: 0, column: 0 },
    end: { line: 0, column: 0 }
  };
  const ANY_PROPERTY = ast.objectProperty(
    ast.identifier(""),
    ast.identifier("")
  );
  const ANY_SELECTABLE_PROPERTY: ast.SelectableObjectProperty = {
    ...ANY_PROPERTY,
    loc: ANY_LOC,
    key: {
      ...ANY_PROPERTY.key,
      loc: ANY_LOC
    },
    value: {
      ...ANY_PROPERTY.value,
      loc: ANY_LOC
    }
  };

  return new InlinableObjectPattern(
    child,
    initName,
    ANY_SELECTABLE_PROPERTY,
    false
  );
}
