import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code } from "../../editor/editor";
import { convertIfElseToTernary } from "./convert-if-else-to-ternary";

describe("Convert If/Else to Ternary", () => {
  describe("should convert if/else to ternary", () => {
    it("with a return value", () => {
      shouldConvertIfElseToTernary({
        code: `function reservationMode(daysInAdvance) {
  if ([cursor]daysInAdvance > 10) {
    return "early";
  } else {
    return "normal";
  }
}`,
        expected: `function reservationMode(daysInAdvance) {
  return daysInAdvance > 10 ? "early" : "normal";
}`
      });
    });

    it("with an assignment", () => {
      shouldConvertIfElseToTernary({
        code: `function reservationMode(daysInAdvance) {
  let mode;
  if ([cursor]daysInAdvance > 10) {
    mode = "early";
  } else {
    mode = "normal";
  }
  return \`reserve-\${mode}\`;
}`,
        expected: `function reservationMode(daysInAdvance) {
  let mode;
  mode = daysInAdvance > 10 ? "early" : "normal";
  return \`reserve-\${mode}\`;
}`
      });
    });

    it("with an assignment of a member expression", () => {
      shouldConvertIfElseToTernary({
        code: `if (isJSXText(node)) {
  result.parseExtractedCode = (code) => "JSX: " + code;
} else {
  result.parseExtractedCode = (code) => code;
}`,
        expected: `result.parseExtractedCode = isJSXText(node) ? (code) => "JSX: " + code : (code) => code;`
      });
    });

    it("with a return value and dead code after", () => {
      shouldConvertIfElseToTernary({
        code: `function reservationMode(daysInAdvance) {
  if ([cursor]daysInAdvance > 10) {
    return "early";
    console.log("dead code");
  } else {
    return "normal";
  }
}`,
        expected: `function reservationMode(daysInAdvance) {
  return daysInAdvance > 10 ? "early" : "normal";
}`
      });
    });

    it("with an assignment of a different operator", () => {
      shouldConvertIfElseToTernary({
        code: `function getTotalFees(daysInAdvance) {
  let fees = 10;
  if ([cursor]daysInAdvance > 10) {
    fees += 2;
  } else {
    fees += 6;
  }
  return fees;
}`,
        expected: `function getTotalFees(daysInAdvance) {
  let fees = 10;
  fees += daysInAdvance > 10 ? 2 : 6;
  return fees;
}`
      });
    });

    it("nested, cursor on nested", () => {
      shouldConvertIfElseToTernary({
        code: `function reservationMode(daysInAdvance) {
  if (daysInAdvance > 10) {
    if[cursor] (isVIP) {
      return "vip";
    } else {
      return "early";
    }
  } else {
    return "normal";
  }
}`,
        expected: `function reservationMode(daysInAdvance) {
  if (daysInAdvance > 10) {
    return isVIP ? "vip" : "early";
  } else {
    return "normal";
  }
}`
      });
    });

    it("implicit else clause", () => {
      shouldConvertIfElseToTernary({
        code: `function reservationMode(daysInAdvance) {
  if (daysInAdvance > 10) {
    re[cursor]turn "early";
  }

  return "normal";
}`,
        expected: `function reservationMode(daysInAdvance) {
  return daysInAdvance > 10 ? "early" : "normal";
}`
      });
    });

    it("preserve comments before and after condition", () => {
      shouldConvertIfElseToTernary({
        code: `function reservationMode(daysInAdvance) {
  // leading comment
  if ([cursor]daysInAdvance > 10) {
    return "early";
  } else {
    return "normal";
  }
  // trailing comment
}`,
        expected: `function reservationMode(daysInAdvance) {
  // leading comment
  return daysInAdvance > 10 ? "early" : "normal";
  // trailing comment
}`
      });
    });

    it("preserve comments for returned values", () => {
      shouldConvertIfElseToTernary({
        code: `function reservationMode(daysInAdvance) {
  if ([cursor]daysInAdvance > 10) {
    // Early scenario.
    return "early";
  } else {
    // Normal scenario.
    return "normal";
  }
}`,
        expected: `function reservationMode(daysInAdvance) {
  // Early scenario.
  // Normal scenario.
  return daysInAdvance > 10 ? "early" : "normal";
}`
      });
    });

    it("preserve comments for assigned values", () => {
      shouldConvertIfElseToTernary({
        code: `function reservationMode(daysInAdvance) {
  let mode;
  if ([cursor]daysInAdvance > 10) {
    // Early scenario.
    mode = "early";
  } else {
    // Normal scenario.
    mode = "normal";
  }
  return \`reserve-\${mode}\`;
}`,
        expected: `function reservationMode(daysInAdvance) {
  let mode;

  // Early scenario.
  // Normal scenario.
  mode = daysInAdvance > 10 ? "early" : "normal";

  return \`reserve-\${mode}\`;
}`
      });
    });
  });

  describe("should not convert if/else to ternary when", () => {
    it("there is an `else if` branch", () => {
      shouldNotConvert(`function reservationMode(daysInAdvance) {
  if ([cursor]daysInAdvance > 10) {
    return "early";
  } else if (daysInAdvance > 5) {
    return "normal";
  } else {
    return "late";
  }
}`);
    });

    it("there are other expressions in if branch (return statement)", () => {
      shouldNotConvert(`function reservationMode(daysInAdvance) {
  if ([cursor]daysInAdvance > 10) {
    console.log("debug");
    return "early";
  } else {
    return "normal";
  }
}`);
    });

    it("there are other expressions in if branch (assignment expression)", () => {
      shouldNotConvert(`function reservationMode(daysInAdvance) {
  let [cursor]mode;
  if (daysInAdvance > 10) {
    mode = "early";
    console.log("debug");
  } else {
    mode = "normal";
  }
  return \`reserve-\${mode}\`;
}`);
    });

    it("many variables are assigned", () => {
      shouldNotConvert(`function reservationMode(daysInAdvance) {
  let mode, urgency;
  if ([cursor]daysInAdvance > 10) {
    mode = "early";
    urgency = "low";
  } else {
    mode = "normal"
    urgency = "high";
  }
  return \`reserve-\${mode}-\${urgency}\`;
}`);
    });

    it("assigned variables identifiers are different", () => {
      shouldNotConvert(`function reservationMode(daysInAdvance) {
  let mode, urgency;
  if ([cursor]daysInAdvance > 10) {
    mode = "early";
  } else {
    urgency = "high";
  }
  return \`reserve-\${mode}\`;
}`);
    });

    it("assigned variables operators are different", () => {
      shouldNotConvert(`function getTotalFees(daysInAdvance) {
  let fees = 10;
  if ([cursor]daysInAdvance > 10) {
    fees -= 2;
  } else {
    fees += 6;
  }
  return fees;
}`);
    });

    it("there is no obvious implicit else branch", () => {
      shouldNotConvert(`function reservationMode(daysInAdvance) {
  if ([cursor]daysInAdvance > 10) {
    return "early";
  }

  console.log("logging some stuff");
  return "normal";
}`);
    });

    it("there is a nested if statement inside", () => {
      shouldNotConvert(`function reservationMode(daysInAdvance) {
  if ([cursor]daysInAdvance > 10) {
    if (isVIP) {
      return "vip";
    } else {
      return "early";
    }
  } else {
    return "normal";
  }
}`);
    });
  });

  it("should show an error message if selection has no valid if/else to convert", () => {
    const code = `console.log("no if/else")`;
    const editor = new InMemoryEditor(code);
    const result = convertIfElseToTernary({
      state: "new",
      code: editor.code,
      selection: editor.selection
    });

    expect(result.action).toBe("show error");
  });
});

function shouldConvertIfElseToTernary({
  code,
  expected
}: {
  code: Code;
  expected: Code;
}) {
  const editor = new InMemoryEditor(code);
  const result = convertIfElseToTernary({
    state: "new",
    code: editor.code,
    selection: editor.selection
  });

  expect(result).toMatchObject({ action: "write", code: expected });
}

function shouldNotConvert(code: Code) {
  const editor = new InMemoryEditor(code);
  const result = convertIfElseToTernary({
    state: "new",
    code: editor.code,
    selection: editor.selection
  });

  expect(result.action).toBe("show error");
}
