import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code } from "../../editor/editor";
import { removeRedundantElse } from "./remove-redundant-else";

describe("Remove Redundant Else", () => {
  describe("should remove redundant else", () => {
    it("basic scenario", () => {
      shouldRemoveRedundantElse({
        code: `function doSomethingIfValid() {
  console.log("Start working");

  i[start]f (!isValid) {
    showWarning();
    return;
  } else {
    doSomething();
    doAnotherThing();
  }[end]

  doSomeFinalThing();
}`,
        expected: `function doSomethingIfValid() {
  console.log("Start working");

  if (!isValid) {
    showWarning();
    return;
  }

  doSomething();
  doAnotherThing();

  doSomeFinalThing();
}`
      });
    });

    it("basic scenario with tabs", () => {
      shouldRemoveRedundantElse({
        code: `function doSomethingIfValid() {
\t[start]if (!isValid) {
\t\tshowWarning();
\t\treturn;
\t} else {
\t\tdoSomething();
\t}[end]
}`,
        expected: `function doSomethingIfValid() {
\tif (!isValid) {
\t\tshowWarning();
\t\treturn;
\t}
\tdoSomething();
}`
      });
    });

    it("only the selected one", () => {
      shouldRemoveRedundantElse({
        code: `function doSomethingIfValid() {
  i[start]f (!isValid) {
    showWarning();
    return;
  } else {
    doSomething();
    doAnotherThing();
  }[end]

  if (!isCorrect) {
    showWarning();
    return;
  } else {
    showMessage();
  }
}`,
        expected: `function doSomethingIfValid() {
  if (!isValid) {
    showWarning();
    return;
  }

  doSomething();
  doAnotherThing();

  if (!isCorrect) {
    showWarning();
    return;
  } else {
    showMessage();
  }
}`
      });
    });

    it("when cursor is inside", () => {
      shouldRemoveRedundantElse({
        code: `function doSomethingIfValid() {
  if (!isValid) {
    showWarning();
    [cursor]return;
  } else {
    doSomething();
    doAnotherThing();
  }
}`,
        expected: `function doSomethingIfValid() {
  if (!isValid) {
    showWarning();
    return;
  }
  doSomething();
  doAnotherThing();
}`
      });
    });

    it("with throw expression", () => {
      shouldRemoveRedundantElse({
        code: `function doSomethingIfValid() {
  if (!isValid) {
    throw new Error("Oh no!");
  }[cursor] else {
    doSomething();
    doAnotherThing();
  }
}`,
        expected: `function doSomethingIfValid() {
  if (!isValid) {
    throw new Error("Oh no!");
  }
  doSomething();
  doAnotherThing();
}`
      });
    });

    it("with else if", () => {
      shouldRemoveRedundantElse({
        code: `function doSomethingIfValid() {
  if (!isValid) {
    [cursor]throw new Error("Oh no!");
  } else if (isCorrect) {
    doSomething();
  } else {
    doAnotherThing();
  }
}`,
        expected: `function doSomethingIfValid() {
  if (!isValid) {
    throw new Error("Oh no!");
  }
  if (isCorrect) {
    doSomething();
  } else {
    doAnotherThing();
  }
}`
      });
    });

    it("nested, cursor on wrapper", () => {
      shouldRemoveRedundantElse({
        code: `function doSomethingIfValid() {
  [cursor]if (!isValid) {
    if (shouldShowWarning) {
      showWarning();
      return;
    } else {
      doNothing();
    }
    return;
  } else {
    doSomething();
  }
}`,
        expected: `function doSomethingIfValid() {
  if (!isValid) {
    if (shouldShowWarning) {
      showWarning();
      return;
    } else {
      doNothing();
    }
    return;
  }
  doSomething();
}`
      });
    });

    it("nested, cursor on nested", () => {
      shouldRemoveRedundantElse({
        code: `function doSomethingIfValid() {
  if (!isValid) {
    [cursor]if (shouldShowWarning) {
      showWarning();
      return;
    } else {
      doNothing();
    }
    return;
  } else {
    doSomething();
  }
}`,
        expected: `function doSomethingIfValid() {
  if (!isValid) {
    if (shouldShowWarning) {
      showWarning();
      return;
    }
    doNothing();
    return;
  } else {
    doSomething();
  }
}`
      });
    });

    it("invalid nested, cursor on nested", () => {
      shouldRemoveRedundantElse({
        code: `function doSomethingIfValid() {
  if (!isValid) {
    [cursor]if (shouldShowWarning) {
      showWarning();
    }
    return;
  } else {
    doSomething();
  }
}`,
        expected: `function doSomethingIfValid() {
  if (!isValid) {
    if (shouldShowWarning) {
      showWarning();
    }
    return;
  }
  doSomething();
}`
      });
    });

    it("if has no braces", () => {
      shouldRemoveRedundantElse({
        code: `function doSomethingIfValid() {
  if (!isValid)[cursor]
    return;
  else if (isMorning)
    return;
}`,
        expected: `function doSomethingIfValid() {
  if (!isValid)
    return;
  if (isMorning)
    return;
}`
      });
    });

    it("if has no sibling next (guard clause)", () => {
      shouldRemoveRedundantElse({
        code: `function doSomethingIfValid() {
  if (age < 6) {[cursor]
    sendResponse(FREE_LIFT);
  } else if (age > 64) {
    sendResponse({ cost: Math.ceil(basePrice.cost * 0.4) });
  } else {
    sendResponse(basePrice);
  }
}`,
        expected: `function doSomethingIfValid() {
  if (age < 6) {
    sendResponse(FREE_LIFT);
    return;
  }
  if (age > 64) {
    sendResponse({ cost: Math.ceil(basePrice.cost * 0.4) });
  } else {
    sendResponse(basePrice);
  }
}`
      });
    });

    it("if has nested branches that all exit (guard clause, no return)", () => {
      shouldRemoveRedundantElse({
        code: `function doSomethingIfValid() {
  if[cursor] (g.fragile) {
    if (g.weightKg <= 2.0) {
      return 'REINDEER-EXPRESS';
    } else {
      return 'SLED';
    }
  } else {
    return 'SLED';
  }
}`,
        expected: `function doSomethingIfValid() {
  if (g.fragile) {
    if (g.weightKg <= 2.0) {
      return 'REINDEER-EXPRESS';
    } else {
      return 'SLED';
    }
  }
  return 'SLED';
}`
      });
    });
  });

  it("should show an error message if selection has no redundant else", () => {
    const code = `[start]if (!isValid) {
  showWarning();
} else {
  doSomething();
  doAnotherThing();
}[end]

console.log("some text");`;
    const editor = new InMemoryEditor(code);
    const result = removeRedundantElse({
      state: "new",
      code: editor.code,
      selection: editor.selection,
      highlightSources: []
    });

    expect(result.action).toBe("show error");
  });
});

function shouldRemoveRedundantElse({
  code,
  expected
}: {
  code: Code;
  expected: Code;
}) {
  const editor = new InMemoryEditor(code);
  const result = removeRedundantElse({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });

  expect(result).toMatchObject({ action: "write", code: expected });
}
