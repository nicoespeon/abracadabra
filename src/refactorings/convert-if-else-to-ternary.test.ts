import { Code } from "./editor/i-write-code";
import { Selection } from "./editor/selection";
import { ShowErrorMessage, ErrorReason } from "./editor/i-show-error-message";
import { createWriteInMemory } from "./adapters/write-code-in-memory";
import { convertIfElseToTernary } from "./convert-if-else-to-ternary";
import { testEach } from "../tests-helpers";

describe("Convert If/Else to Ternary", () => {
  let showErrorMessage: ShowErrorMessage;

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
        description: "there is no else branch",
        code: `function reservationMode(daysInAdvance) {
  if (daysInAdvance > 10) {
    return "early";
  }
  return "normal";
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
      ErrorReason.DidNotFoundIfElseToConvert
    );
  });

  async function doConvertIfElseToTernary(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const [write, getState] = createWriteInMemory(code);
    await convertIfElseToTernary(code, selection, write, showErrorMessage);
    return getState().code;
  }
});
