import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code, ErrorReason } from "../../editor/editor";
import { testEach } from "../../tests-helpers";
import { convertIfElseToTernary } from "./convert-if-else-to-ternary";

describe("Convert If/Else to Ternary", () => {
  testEach<{ code: Code; expected: Code }>(
    "should convert if/else to ternary",
    [
      {
        description: "with a return value",
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
      },
      {
        description: "with an assignment",
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
      },
      {
        description: "with an assignment of a member expression",
        code: `if (isJSXText(node)) {
  result.parseExtractedCode = (code) => "JSX: " + code;
} else {
  result.parseExtractedCode = (code) => code;
}`,
        expected: `result.parseExtractedCode = isJSXText(node) ? (code) => "JSX: " + code : (code) => code;`
      },
      {
        description: "with a return value and dead code after",
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
      },
      {
        description: "with an assignment of a different operator",
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
      },
      {
        description: "nested, cursor on nested",
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
      },
      {
        description: "implicit else clause",
        code: `function reservationMode(daysInAdvance) {
  if (daysInAdvance > 10) {
    re[cursor]turn "early";
  }

  return "normal";
}`,
        expected: `function reservationMode(daysInAdvance) {
  return daysInAdvance > 10 ? "early" : "normal";
}`
      },
      {
        description: "preserve comments before and after condition",
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
      },
      {
        description: "preserve comments for returned values",
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
      },
      {
        description: "preserve comments for assigned values",
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
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await convertIfElseToTernary(editor);

      expect(editor.code).toBe(expected);
    }
  );

  testEach<{ code: Code }>(
    "should not convert if/else to ternary when",
    [
      {
        description: "there is an `else if` branch",
        code: `function reservationMode(daysInAdvance) {
  if ([cursor]daysInAdvance > 10) {
    return "early";
  } else if (daysInAdvance > 5) {
    return "normal";
  } else {
    return "late";
  }
}`
      },
      {
        description:
          "there are other expressions in if branch (return statement)",
        code: `function reservationMode(daysInAdvance) {
  if ([cursor]daysInAdvance > 10) {
    console.log("debug");
    return "early";
  } else {
    return "normal";
  }
}`
      },
      {
        description:
          "there are other expressions in if branch (assignment expression)",
        code: `function reservationMode(daysInAdvance) {
  let [cursor]mode;
  if (daysInAdvance > 10) {
    mode = "early";
    console.log("debug");
  } else {
    mode = "normal";
  }
  return \`reserve-\${mode}\`;
}`
      },
      {
        description: "many variables are assigned",
        code: `function reservationMode(daysInAdvance) {
  let mode, urgency;
  if ([cursor]daysInAdvance > 10) {
    mode = "early";
    urgency = "low";
  } else {
    mode = "normal"
    urgency = "high";
  }
  return \`reserve-\${mode}-\${urgency}\`;
}`
      },
      {
        description: "assigned variables identifiers are different",
        code: `function reservationMode(daysInAdvance) {
  let mode, urgency;
  if ([cursor]daysInAdvance > 10) {
    mode = "early";
  } else {
    urgency = "high";
  }
  return \`reserve-\${mode}\`;
}`
      },
      {
        description: "assigned variables operators are different",
        code: `function getTotalFees(daysInAdvance) {
  let fees = 10;
  if ([cursor]daysInAdvance > 10) {
    fees -= 2;
  } else {
    fees += 6;
  }
  return fees;
}`
      },
      {
        description: "there is no obvious implicit else branch",
        code: `function reservationMode(daysInAdvance) {
  if ([cursor]daysInAdvance > 10) {
    return "early";
  }

  console.log("logging some stuff");
  return "normal";
}`
      },
      {
        description: "there is a nested if statement inside",
        code: `function reservationMode(daysInAdvance) {
  if ([cursor]daysInAdvance > 10) {
    if (isVIP) {
      return "vip";
    } else {
      return "early";
    }
  } else {
    return "normal";
  }
}`
      }
    ],

    async ({ code }) => {
      const editor = new InMemoryEditor(code);
      const originalCode = editor.code;

      await convertIfElseToTernary(editor);

      expect(editor.code).toBe(originalCode);
    }
  );

  it("should show an error message if selection has no valid if/else to convert", async () => {
    const code = `console.log("no if/else")`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await convertIfElseToTernary(editor);

    expect(editor.showError).toHaveBeenCalledWith(
      ErrorReason.DidNotFindIfElseToConvert
    );
  });
});
