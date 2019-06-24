import { Code } from "./i-write-code";
import { convertIfElseToTernary } from "./convert-if-else-to-ternary";
import { Selection } from "./selection";
import { ShowErrorMessage, ErrorReason } from "./i-show-error-message";
import { createWriteInMemory } from "./adapters/write-code-in-memory";

describe("Convert If/Else to Ternary", () => {
  let showErrorMessage: ShowErrorMessage;

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  it.each<[string, { code: Code; selection: Selection; expected: Code }]>([
    [
      "with a return value",
      {
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
      }
    ],
    [
      "with an assignment",
      {
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
      }
    ],
    [
      "with a return value and dead code after",
      {
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
      }
    ],
    [
      "with an assignment of a different operator",
      {
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
    ]
  ])(
    "should convert if/else to ternary (%s)",
    async (_, { code, selection, expected }) => {
      const result = await doConvertIfElseToTernary(code, selection);

      expect(result).toBe(expected);
    }
  );

  it.each<[string, { code: Code; selection: Selection }]>([
    [
      "there is an `else if` branch",
      {
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
      }
    ],
    [
      "there are other expressions in if branch (return statement)",
      {
        code: `function reservationMode(daysInAdvance) {
  if (daysInAdvance > 10) {
    console.log("debug");
    return "early";
  } else {
    return "normal";
  }
}`,
        selection: Selection.cursorAt(1, 6)
      }
    ],
    [
      "there are other expressions in if branch (assignment expression)",
      {
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
      }
    ],
    [
      "many variables are assigned",
      {
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
      }
    ],
    [
      "assigned variables identifiers are different",
      {
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
      }
    ],
    [
      "assigned variables operators are different",
      {
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
      }
    ],
    [
      "there is no else branch",
      {
        code: `function reservationMode(daysInAdvance) {
  if (daysInAdvance > 10) {
    return "early";
  }
  return "normal";
}`,
        selection: Selection.cursorAt(1, 6)
      }
    ]
  ])(
    "should not convert if/else to ternary when %s",
    async (_, { code, selection }) => {
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
    const [write, getCode] = createWriteInMemory(code);
    await convertIfElseToTernary(code, selection, write, showErrorMessage);
    return getCode();
  }
});
