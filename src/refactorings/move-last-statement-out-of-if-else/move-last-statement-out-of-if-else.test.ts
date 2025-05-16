import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code } from "../../editor/editor";
import { moveLastStatementOutOfIfElse } from "./move-last-statement-out-of-if-else";

describe("Move Last Statement Out Of If/Else", () => {
  it("should move out last statement if duplicated", () => {
    shouldMoveLastStatementOutOfIfElse({
      code: `if (isValid) {
  doSomething();
  [cursor]duplicatedCall();
} else {
  doSomethingElse();
  duplicatedCall();
}`,
      expected: `if (isValid) {
  doSomething();
} else {
  doSomethingElse();
}
duplicatedCall();`
    });
  });

  it("should move out the most nested if-statement", () => {
    shouldMoveLastStatementOutOfIfElse({
      code: `if (isAdmin) {
  if (isValid) {
    doSomething();
    [cursor]duplicatedCall();
  } else {
    doSomethingElse();
    duplicatedCall();
  }
  anotherDuplicatedCall();
} else {
  anotherDuplicatedCall();
}`,
      expected: `if (isAdmin) {
  if (isValid) {
    doSomething();
  } else {
    doSomethingElse();
  }
  duplicatedCall();
  anotherDuplicatedCall();
} else {
  anotherDuplicatedCall();
}`
    });
  });

  it("should remove else statement if empty after refactoring", () => {
    shouldMoveLastStatementOutOfIfElse({
      code: `if (isValid) {
  doSomething();
  [cursor]duplicatedCall();
} else {
  duplicatedCall();
}`,
      expected: `if (isValid) {
  doSomething();
}
duplicatedCall();`
    });
  });

  it("should remove if statement if empty after refactoring", () => {
    shouldMoveLastStatementOutOfIfElse({
      code: `if (isValid) {
        [cursor]duplicatedCall();
} else {
  doSomething();
  duplicatedCall();
}`,
      expected: `if (!isValid) {
  doSomething();
}
duplicatedCall();`
    });
  });

  it("should work if else statement has no brace", () => {
    shouldMoveLastStatementOutOfIfElse({
      code: `if (isValid) {
  doSomething();
  [cursor]duplicatedCall();
} else duplicatedCall();`,
      expected: `if (isValid) {
  doSomething();
}
duplicatedCall();`
    });
  });

  it("should show an error if refactoring can't be made", () => {
    shouldShowErrorFor(`// This is a comment, can't be refactored`);
  });

  it("should show an error if there is no else statement", () => {
    shouldShowErrorFor(`if (isValid) {
  doSomething();
  [cursor]duplicatedCall();
}`);
  });

  it("should show an error if last statements are different", () => {
    shouldShowErrorFor(`if (isValid) {
  doSomething();
  [cursor]someOtherCall();
} else {
  doSomethingElse();
}`);
  });

  it("should show an error if last statements have different args", () => {
    shouldShowErrorFor(`if (isValid) {
  doSomething();
  [cursor]duplicatedCall("one", true);
  } else {
    doSomethingElse();
    duplicatedCall("one", false);
}`);
  });
});

function shouldMoveLastStatementOutOfIfElse({
  code,
  expected
}: {
  code: Code;
  expected: Code;
}) {
  const editor = new InMemoryEditor(code);

  const result = moveLastStatementOutOfIfElse({
    state: "new",
    code: editor.code,
    selection: editor.selection
  });

  expect(result).toMatchObject({ action: "write", code: expected });
}

function shouldShowErrorFor(code: Code) {
  const editor = new InMemoryEditor(code);

  const result = moveLastStatementOutOfIfElse({
    state: "new",
    code: editor.code,
    selection: editor.selection
  });

  expect(result.action).toBe("show error");
}
