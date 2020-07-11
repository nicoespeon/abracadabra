import { Selection } from "../../editor/selection";
import { Editor, Code, ErrorReason } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { convertIfElseToTernary } from "./convert-if-else-to-ternary";

describe("Convert If/Else to Ternary", () => {
  let showErrorMessage: Editor["showError"];

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; selection: Selection; expected: Code }>(
    "should convert if/else to ternary",
    [
      {
        description: "with a return value",
        code: `function reservationMode(daysInAdvance) {
  if (daysInAdvance > 10) {
    return "early";
  } else {
    return "normal";
  }
}`,
        selection: Selection.cursorAt(1, 6),
        expected: `function reservationMode(daysInAdvance) {
  return daysInAdvance > 10 ? "early" : "normal";
}`
      },
      {
        description: "with an assignment",
        code: `function reservationMode(daysInAdvance) {
  let mode;
  if (daysInAdvance > 10) {
    mode = "early";
  } else {
    mode = "normal";
  }
  return \`reserve-\${mode}\`;
}`,
        selection: Selection.cursorAt(2, 6),
        expected: `function reservationMode(daysInAdvance) {
  let mode;
  mode = daysInAdvance > 10 ? "early" : "normal";
  return \`reserve-\${mode}\`;
}`
      },
      {
        description: "with an assignment of a member expression",
        code: `if (isJSXText(node)) {
  result.parseExtractedCode = (code) => "JSX: " + code;
} else {
  result.parseExtractedCode = (code) => code;
}`,
        selection: Selection.cursorAt(0, 0),
        expected: `result.parseExtractedCode = isJSXText(node) ? (code) => "JSX: " + code : (code) => code;`
      },
      {
        description: "with a return value and dead code after",
        code: `function reservationMode(daysInAdvance) {
  if (daysInAdvance > 10) {
    return "early";
    console.log("dead code");
  } else {
    return "normal";
  }
}`,
        selection: Selection.cursorAt(1, 6),
        expected: `function reservationMode(daysInAdvance) {
  return daysInAdvance > 10 ? "early" : "normal";
}`
      },
      {
        description: "with an assignment of a different operator",
        code: `function getTotalFees(daysInAdvance) {
  let fees = 10;
  if (daysInAdvance > 10) {
    fees += 2;
  } else {
    fees += 6;
  }
  return fees;
}`,
        selection: Selection.cursorAt(2, 6),
        expected: `function getTotalFees(daysInAdvance) {
  let fees = 10;
  fees += daysInAdvance > 10 ? 2 : 6;
  return fees;
}`
      },
      {
        description: "nested, cursor on nested",
        code: `function reservationMode(daysInAdvance) {
  if (daysInAdvance > 10) {
    if (isVIP) {
      return "vip";
    } else {
      return "early";
    }
  } else {
    return "normal";
  }
}`,
        selection: Selection.cursorAt(2, 6),
        expected: `function reservationMode(daysInAdvance) {
  if (daysInAdvance > 10) {
    return isVIP ? "vip" : "early";
  } else {
    return "normal";
  }
}`
      },
      {
        description: "implicit else clause",
        code: `function reservationMode(daysInAdvance) {
  if (daysInAdvance > 10) {
    return "early";
  }

  return "normal";
}`,
        selection: Selection.cursorAt(2, 6),
        expected: `function reservationMode(daysInAdvance) {
  return daysInAdvance > 10 ? "early" : "normal";
}`
      },
      {
        description: "preserve comments for returned values",
        code: `function reservationMode(daysInAdvance) {
  if (daysInAdvance > 10) {
    // Early scenario.
    return "early";
  } else {
    // Normal scenario.
    return "normal";
  }
}`,
        selection: Selection.cursorAt(1, 6),
        expected: `function reservationMode(daysInAdvance) {
  // Early scenario.
  // Normal scenario.
  return daysInAdvance > 10 ? "early" : "normal";
}`
      },
      {
        description: "preserve comments for assigned values",
        code: `function reservationMode(daysInAdvance) {
  let mode;
  if (daysInAdvance > 10) {
    // Early scenario.
    mode = "early";
  } else {
    // Normal scenario.
    mode = "normal";
  }
  return \`reserve-\${mode}\`;
}`,
        selection: Selection.cursorAt(2, 6),
        expected: `function reservationMode(daysInAdvance) {
  let mode;

  // Early scenario.
  // Normal scenario.
  mode = daysInAdvance > 10 ? "early" : "normal";

  return \`reserve-\${mode}\`;
}`
      }
    ],
    async ({ code, selection, expected }) => {
      const result = await doConvertIfElseToTernary(code, selection);

      expect(result).toBe(expected);
    }
  );

  testEach<{ code: Code; selection: Selection }>(
    "should not convert if/else to ternary when",
    [
      {
        description: "there is an `else if` branch",
        code: `function reservationMode(daysInAdvance) {
  if (daysInAdvance > 10) {
    return "early";
  } else if (daysInAdvance > 5) {
    return "normal";
  } else {
    return "late";
  }
}`,
        selection: Selection.cursorAt(1, 6)
      },
      {
        description:
          "there are other expressions in if branch (return statement)",
        code: `function reservationMode(daysInAdvance) {
  if (daysInAdvance > 10) {
    console.log("debug");
    return "early";
  } else {
    return "normal";
  }
}`,
        selection: Selection.cursorAt(1, 6)
      },
      {
        description:
          "there are other expressions in if branch (assignment expression)",
        code: `function reservationMode(daysInAdvance) {
  let mode;
  if (daysInAdvance > 10) {
    mode = "early";
    console.log("debug");
  } else {
    mode = "normal";
  }
  return \`reserve-\${mode}\`;
}`,
        selection: Selection.cursorAt(1, 6)
      },
      {
        description: "many variables are assigned",
        code: `function reservationMode(daysInAdvance) {
  let mode, urgency;
  if (daysInAdvance > 10) {
    mode = "early";
    urgency = "low";
  } else {
    mode = "normal"
    urgency = "high";
  }
  return \`reserve-\${mode}-\${urgency}\`;
}`,
        selection: Selection.cursorAt(2, 6)
      },
      {
        description: "assigned variables identifiers are different",
        code: `function reservationMode(daysInAdvance) {
  let mode, urgency;
  if (daysInAdvance > 10) {
    mode = "early";
  } else {
    urgency = "high";
  }
  return \`reserve-\${mode}\`;
}`,
        selection: Selection.cursorAt(2, 6)
      },
      {
        description: "assigned variables operators are different",
        code: `function getTotalFees(daysInAdvance) {
  let fees = 10;
  if (daysInAdvance > 10) {
    fees -= 2;
  } else {
    fees += 6;
  }
  return fees;
}`,
        selection: Selection.cursorAt(2, 6)
      },
      {
        description: "there is no obvious implicit else branch",
        code: `function reservationMode(daysInAdvance) {
  if (daysInAdvance > 10) {
    return "early";
  }

  console.log("logging some stuff");
  return "normal";
}`,
        selection: Selection.cursorAt(1, 6)
      },
      {
        description: "there is a nested if statement inside",
        code: `function reservationMode(daysInAdvance) {
  if (daysInAdvance > 10) {
    if (isVIP) {
      return "vip";
    } else {
      return "early";
    }
  } else {
    return "normal";
  }
}`,
        selection: Selection.cursorAt(1, 6)
      }
    ],

    async ({ code, selection }) => {
      const result = await doConvertIfElseToTernary(code, selection);

      expect(result).toBe(code);
    }
  );

  it("should show an error message if selection has no valid if/else to convert", async () => {
    const code = `console.log("no if/else")`;
    const selection = Selection.cursorAt(0, 0);

    await doConvertIfElseToTernary(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFindIfElseToConvert
    );
  });

  async function doConvertIfElseToTernary(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const editor = new InMemoryEditor(code);
    editor.showError = showErrorMessage;
    await convertIfElseToTernary(code, selection, editor);
    return editor.code;
  }
});
