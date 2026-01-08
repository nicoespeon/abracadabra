import * as t from "../../../ast";
import { Modification } from "../../../editor/editor";
import { Selection } from "../../../editor/selection";
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

    expect(child.updateIdentifiersWith).toHaveBeenCalledWith("user.name");
  });

  it("should resolve inlined code path if inlined code is already a member expression", () => {
    const child = new FakeInlinable();
    jest.spyOn(child, "updateIdentifiersWith");
    const inlinable = createInlinableObjectPattern(child, "names");

    inlinable.updateIdentifiersWith("user.first");

    expect(child.updateIdentifiersWith).toHaveBeenCalledWith(
      "user.names.first"
    );
  });

  it("should resolve inlined code path if inlined code is an object property", () => {
    const child = new FakeInlinable();
    jest.spyOn(child, "updateIdentifiersWith");
    const inlinable = createInlinableObjectPattern(child, "user");

    inlinable.updateIdentifiersWith("n: name");

    expect(child.updateIdentifiersWith).toHaveBeenCalledWith("user.n");
  });

  it("should resolve inlined code path if inlined code is a complex member expression", () => {
    const child = new FakeInlinable();
    jest.spyOn(child, "updateIdentifiersWith");
    const inlinable = createInlinableObjectPattern(child, "user");

    inlinable.updateIdentifiersWith("session.data[0].first");

    expect(child.updateIdentifiersWith).toHaveBeenCalledWith(
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

  private updates: Modification[];

  constructor(updates: Modification[] = []) {
    this.updates = updates;
  }

  updateIdentifiersWith = () => this.updates;
}

function createInlinableObjectPattern(child: InlinableCode, initName: string) {
  const ANY_LOC: t.SourceLocation = {
    start: { line: 0, column: 0, index: 0 },
    end: { line: 0, column: 0, index: 0 },
    filename: "",
    identifierName: null
  };
  const ANY_PROPERTY = t.objectProperty(t.identifier(""), t.identifier(""));
  const ANY_SELECTABLE_PROPERTY: t.SelectableObjectProperty = {
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
