import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code } from "../../editor/editor";
import { convertTernaryToIfElse } from "./convert-ternary-to-if-else";

describe("Convert Ternary to If/Else", () => {
  describe("should convert ternary to if/else", () => {
    it("return statement", () => {
      shouldConvertTernaryToIfElse({
        code: `function reservationMode(daysInAdvance) {
  return daysInA[cursor]dvance > 10 ? "early" : "normal";
}`,
        expected: `function reservationMode(daysInAdvance) {
  if (daysInAdvance > 10) {
    return "early";
  } else {
    return "normal";
  }
}`
      });
    });

    it("preserves comments for return", () => {
      shouldConvertTernaryToIfElse({
        code: `function reservationMode(daysInAdvance) {
  // leading comment
  return daysInA[cursor]dvance > 10 ? "early" : "normal";
  // trailing comment
}`,
        expected: `function reservationMode(daysInAdvance) {
  // leading comment
  if (daysInAdvance > 10) {
    return "early";
  } else {
    return "normal";
  }
  // trailing comment
}`
      });
    });

    it("assignment expression", () => {
      shouldConvertTernaryToIfElse({
        code: `function reservationMode(daysInAdvance) {
  let mode;
  mode = daysInA[cursor]dvance > 10 ? "early" : "normal";
  return mode;
}`,
        expected: `function reservationMode(daysInAdvance) {
  let mode;

  if (daysInAdvance > 10) {
    mode = "early";
  } else {
    mode = "normal";
  }

  return mode;
}`
      });
    });

    it("assignment expression with different operator", () => {
      shouldConvertTernaryToIfElse({
        code: `function getTotal(daysInAdvance) {
  let total = 10;
  total += daysI[cursor]nAdvance > 10 ? 2 : 5;
  return total;
}`,
        expected: `function getTotal(daysInAdvance) {
  let total = 10;

  if (daysInAdvance > 10) {
    total += 2;
  } else {
    total += 5;
  }

  return total;
}`
      });
    });

    it("preserves comments for assignment expression", () => {
      shouldConvertTernaryToIfElse({
        code: `function reservationMode(daysInAdvance) {
  let mode;
  // leading comment
  mode = daysInA[cursor]dvance > 10 ? "early" : "normal";
  // trailing comment
  return mode;
}`,
        expected: `function reservationMode(daysInAdvance) {
  let mode;

  // leading comment
  if (daysInAdvance > 10) {
    mode = "early";
  } else {
    mode = "normal";
  }

  // trailing comment
  return mode;
}`
      });
    });

    it("variable declaration", () => {
      shouldConvertTernaryToIfElse({
        code: `function reservationMode(daysInAdvance) {
  const mode = d[cursor]aysInAdvance > 10 ? "early" : "normal";
  return mode;
}`,
        expected: `function reservationMode(daysInAdvance) {
  let mode;

  if (daysInAdvance > 10) {
    mode = "early";
  } else {
    mode = "normal";
  }

  return mode;
}`
      });
    });

    it("preserves comments for variable declaration", () => {
      shouldConvertTernaryToIfElse({
        code: `function reservationMode(daysInAdvance) {
  // leading comment
  const mode = d[cursor]aysInAdvance > 10 ? "early" : "normal";
  // trailing comment
  return mode;
}`,
        expected: `function reservationMode(daysInAdvance) {
  // leading comment
  let mode;

  if (daysInAdvance > 10) {
    mode = "early";
  } else {
    mode = "normal";
  }

  // trailing comment
  return mode;
}`
      });
    });

    it("whole ternary selected", () => {
      shouldConvertTernaryToIfElse({
        code: `[start]let publishesNeedingLink = args.forcelink ? page.directives : page.findPublishesLackingLinkInPage();[end]`,
        expected: `let publishesNeedingLink;

if (args.forcelink) {
  publishesNeedingLink = page.directives;
} else {
  publishesNeedingLink = page.findPublishesLackingLinkInPage();
}`
      });
    });

    it("nested ternary, cursor on wrapping ternary", () => {
      shouldConvertTernaryToIfElse({
        code: `function reservationMode(daysInAdvance) {
  return daysInA[cursor]dvance > 10 ? "early" : isVIP ? "vip" : "normal";
}`,
        expected: `function reservationMode(daysInAdvance) {
  if (daysInAdvance > 10) {
    return "early";
  } else {
    return isVIP ? "vip" : "normal";
  }
}`
      });
    });

    it("nested ternary on consequent branch, cursor on nested ternary", () => {
      shouldConvertTernaryToIfElse({
        code: `function reservationMode(daysInAdvance) {
  return daysInAdvance <= 10 ? isV[cursor]IP ? "vip" : "normal" : "early";
}`,
        expected: `function reservationMode(daysInAdvance) {
  if (isVIP) {
    return daysInAdvance <= 10 ? "vip" : "early";
  } else {
    return daysInAdvance <= 10 ? "normal" : "early";
  }
}`
      });
    });

    it("nested ternary on alternate branch, cursor on nested ternary", () => {
      shouldConvertTernaryToIfElse({
        code: `function reservationMode(daysInAdvance) {
  return daysInAdvance > 10 ? "early" : isVI[cursor]P ? "vip" : "normal";
}`,
        expected: `function reservationMode(daysInAdvance) {
  if (isVIP) {
    return daysInAdvance > 10 ? "early" : "vip";
  } else {
    return daysInAdvance > 10 ? "early" : "normal";
  }
}`
      });
    });

    it("nested ternary on both branches, cursor on consequent nested ternary", () => {
      shouldConvertTernaryToIfElse({
        code: `function reservationMode(daysInAdvance) {
  return daysInAdvance <= 10 ? isV[cursor]IP ? "vip" : "normal" : isEarly ? "early" : "unknown";
}`,
        expected: `function reservationMode(daysInAdvance) {
  if (isVIP) {
    return daysInAdvance <= 10 ? "vip" : isEarly ? "early" : "unknown";
  } else {
    return daysInAdvance <= 10 ? "normal" : isEarly ? "early" : "unknown";
  }
}`
      });
    });

    it("nested ternary on both branches, cursor on alternate nested ternary", () => {
      shouldConvertTernaryToIfElse({
        code: `function reservationMode(daysInAdvance) {
  return daysInAdvance <= 10 ? isVIP ? "vip" : "normal" : is[cursor]Early ? "early" : "unknown";
}`,
        expected: `function reservationMode(daysInAdvance) {
  if (isEarly) {
    return daysInAdvance <= 10 ? isVIP ? "vip" : "normal" : "early";
  } else {
    return daysInAdvance <= 10 ? isVIP ? "vip" : "normal" : "unknown";
  }
}`
      });
    });

    it("deeply nested ternary, cursor on nested ternary", () => {
      shouldConvertTernaryToIfElse({
        code: `function reservationMode(daysInAdvance) {
  return daysInAdvance <= 10 ? isVIP ? "vip" : isN[cursor]ormal ? "normal" : "unknown" :"early";
}`,
        expected: `function reservationMode(daysInAdvance) {
  if (isNormal) {
    return daysInAdvance <= 10 ? isVIP ? "vip" : "normal" : "early";
  } else {
    return daysInAdvance <= 10 ? isVIP ? "vip" : "unknown" : "early";
  }
}`
      });
    });

    it("deeply nested ternary, assignment expression", () => {
      shouldConvertTernaryToIfElse({
        code: `function reservationMode(daysInAdvance) {
  let mode;
  mode = daysInAdvance <= 10 ? isVIP ? "vip" : isNo[cursor]rmal ? "normal" : "unknown" :"early";
  return mode;
}`,
        expected: `function reservationMode(daysInAdvance) {
  let mode;

  if (isNormal) {
    mode = daysInAdvance <= 10 ? isVIP ? "vip" : "normal" : "early";
  } else {
    mode = daysInAdvance <= 10 ? isVIP ? "vip" : "unknown" : "early";
  }

  return mode;
}`
      });
    });

    it("deeply nested ternary, variable declaration", () => {
      shouldConvertTernaryToIfElse({
        code: `function reservationMode(daysInAdvance) {
  const mode = daysInAdvance <= 10 ? isVIP ? "vip" : isN[cursor]ormal ? "normal" : "unknown" :"early";
  return mode;
}`,
        expected: `function reservationMode(daysInAdvance) {
  let mode;

  if (isNormal) {
    mode = daysInAdvance <= 10 ? isVIP ? "vip" : "normal" : "early";
  } else {
    mode = daysInAdvance <= 10 ? isVIP ? "vip" : "unknown" : "early";
  }

  return mode;
}`
      });
    });

    it("a ternary that is not returned", () => {
      shouldConvertTernaryToIfElse({
        code: `function doSomething(isValid) {
  [cursor]isValid ? doThis() : doThat();
}`,
        expected: `function doSomething(isValid) {
  if (isValid) {
    doThis();
  } else {
    doThat();
  }
}`
      });
    });

    it("preserves comments for ternary that is not returned", () => {
      shouldConvertTernaryToIfElse({
        code: `function doSomething(isValid) {
  // leading comment
  [cursor]isValid ? doThis() : doThat();
  // trailing comment
}`,
        expected: `function doSomething(isValid) {
  // leading comment
  if (isValid) {
    doThis();
  } else {
    doThat();
  }
  // trailing comment
}`
      });
    });
  });

  it("should show an error message if selection has no valid ternary to convert", () => {
    const code = `console.log("no ternary")`;
    const editor = new InMemoryEditor(code);
    const result = convertTernaryToIfElse({
      state: "new",
      code: editor.code,
      selection: editor.selection,
      highlightSources: []
    });

    expect(result.action).toBe("show error");
  });

  it("should not convert ternary in variable declaration if there are other declarations", () => {
    const code = `let links = args.forceLink[cursor] ? [] : null, isValid = args.forceLink ? true : false`;
    const editor = new InMemoryEditor(code);
    const result = convertTernaryToIfElse({
      state: "new",
      code: editor.code,
      selection: editor.selection,
      highlightSources: []
    });

    expect(result.action).toBe("show error");
  });
});

function shouldConvertTernaryToIfElse({
  code,
  expected
}: {
  code: Code;
  expected: Code;
}) {
  const editor = new InMemoryEditor(code);
  const result = convertTernaryToIfElse({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });

  expect(result).toMatchObject({ action: "write", code: expected });
}
