import { Code } from "./editor/i-write-code";
import { Selection } from "./editor/selection";
import { ShowErrorMessage, ErrorReason } from "./editor/i-show-error-message";
import { createWriteInMemory } from "./adapters/write-code-in-memory";
import { convertTernaryToIfElse } from "./convert-ternary-to-if-else";

describe("Convert Ternary to If/Else", () => {
  let showErrorMessage: ShowErrorMessage;

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  it.each<[string, { code: Code; selection: Selection; expected: Code }]>([
    [
      "return statement",
      {
        code: `function reservationMode(daysInAdvance) {
  return daysInAdvance > 10 ? "early" : "normal";
}`,
        selection: Selection.cursorAt(1, 16),
        expected: `function reservationMode(daysInAdvance) {
  if (daysInAdvance > 10) {
    return "early";
  } else {
    return "normal";
  }
}`
      }
    ],
    [
      "assignment expression",
      {
        code: `function reservationMode(daysInAdvance) {
  let mode;
  mode = daysInAdvance > 10 ? "early" : "normal";
  return mode;
}`,
        selection: Selection.cursorAt(2, 16),
        expected: `function reservationMode(daysInAdvance) {
  let mode;

  if (daysInAdvance > 10) {
    mode = "early";
  } else {
    mode = "normal";
  }

  return mode;
}`
      }
    ],
    [
      "variable declaration",
      {
        code: `function reservationMode(daysInAdvance) {
  const mode = daysInAdvance > 10 ? "early" : "normal";
  return mode;
}`,
        selection: Selection.cursorAt(1, 16),
        expected: `function reservationMode(daysInAdvance) {
  let mode;

  if (daysInAdvance > 10) {
    mode = "early";
  } else {
    mode = "normal";
  }

  return mode;
}`
      }
    ],
    [
      "nested ternary, cursor on wrapping ternary",
      {
        code: `function reservationMode(daysInAdvance) {
  return daysInAdvance > 10 ? "early" : isVIP ? "vip" : "normal";
}`,
        selection: Selection.cursorAt(1, 16),
        expected: `function reservationMode(daysInAdvance) {
  if (daysInAdvance > 10) {
    return "early";
  } else {
    return isVIP ? "vip" : "normal";
  }
}`
      }
    ],
    [
      "nested ternary on consequent branch, cursor on nested ternary",
      {
        code: `function reservationMode(daysInAdvance) {
  return daysInAdvance <= 10 ? isVIP ? "vip" : "normal" : "early";
}`,
        selection: Selection.cursorAt(1, 34),
        expected: `function reservationMode(daysInAdvance) {
  if (isVIP) {
    return daysInAdvance <= 10 ? "vip" : "early";
  } else {
    return daysInAdvance <= 10 ? "normal" : "early";
  }
}`
      }
    ],
    [
      "nested ternary on alternate branch, cursor on nested ternary",
      {
        code: `function reservationMode(daysInAdvance) {
  return daysInAdvance > 10 ? "early" : isVIP ? "vip" : "normal";
}`,
        selection: Selection.cursorAt(1, 44),
        expected: `function reservationMode(daysInAdvance) {
  if (isVIP) {
    return daysInAdvance > 10 ? "early" : "vip";
  } else {
    return daysInAdvance > 10 ? "early" : "normal";
  }
}`
      }
    ],
    [
      "nested ternary on both branches, cursor on consequent nested ternary",
      {
        code: `function reservationMode(daysInAdvance) {
  return daysInAdvance <= 10 ? isVIP ? "vip" : "normal" : isEarly ? "early" : "unknown";
}`,
        selection: Selection.cursorAt(1, 34),
        expected: `function reservationMode(daysInAdvance) {
  if (isVIP) {
    return daysInAdvance <= 10 ? "vip" : isEarly ? "early" : "unknown";
  } else {
    return daysInAdvance <= 10 ? "normal" : isEarly ? "early" : "unknown";
  }
}`
      }
    ],
    [
      "nested ternary on both branches, cursor on alternate nested ternary",
      {
        code: `function reservationMode(daysInAdvance) {
  return daysInAdvance <= 10 ? isVIP ? "vip" : "normal" : isEarly ? "early" : "unknown";
}`,
        selection: Selection.cursorAt(1, 60),
        expected: `function reservationMode(daysInAdvance) {
  if (isEarly) {
    return daysInAdvance <= 10 ? isVIP ? "vip" : "normal" : "early";
  } else {
    return daysInAdvance <= 10 ? isVIP ? "vip" : "normal" : "unknown";
  }
}`
      }
    ],
    [
      "deeply nested ternary, cursor on nested ternary",
      {
        code: `function reservationMode(daysInAdvance) {
  return daysInAdvance <= 10 ? isVIP ? "vip" : isNormal ? "normal" : "unknown" :"early";
}`,
        selection: Selection.cursorAt(1, 50),
        expected: `function reservationMode(daysInAdvance) {
  if (isNormal) {
    return daysInAdvance <= 10 ? isVIP ? "vip" : "normal" : "early";
  } else {
    return daysInAdvance <= 10 ? isVIP ? "vip" : "unknown" : "early";
  }
}`
      }
    ],
    [
      "deeply nested ternary, assignment expression",
      {
        code: `function reservationMode(daysInAdvance) {
  let mode;
  mode = daysInAdvance <= 10 ? isVIP ? "vip" : isNormal ? "normal" : "unknown" :"early";
  return mode;
}`,
        selection: Selection.cursorAt(2, 51),
        expected: `function reservationMode(daysInAdvance) {
  let mode;

  if (isNormal) {
    mode = daysInAdvance <= 10 ? isVIP ? "vip" : "normal" : "early";
  } else {
    mode = daysInAdvance <= 10 ? isVIP ? "vip" : "unknown" : "early";
  }

  return mode;
}`
      }
    ],
    [
      "deeply nested ternary, variable declaration",
      {
        code: `function reservationMode(daysInAdvance) {
  const mode = daysInAdvance <= 10 ? isVIP ? "vip" : isNormal ? "normal" : "unknown" :"early";
  return mode;
}`,
        selection: Selection.cursorAt(1, 56),
        expected: `function reservationMode(daysInAdvance) {
  let mode;

  if (isNormal) {
    mode = daysInAdvance <= 10 ? isVIP ? "vip" : "normal" : "early";
  } else {
    mode = daysInAdvance <= 10 ? isVIP ? "vip" : "unknown" : "early";
  }

  return mode;
}`
      }
    ]
  ])(
    "should convert ternary to if/else (%s)",
    async (_, { code, selection, expected }) => {
      const result = await doConvertTernaryToIfElse(code, selection);

      expect(result).toBe(expected);
    }
  );

  it("should show an error message if selection has no valid ternary to convert", async () => {
    const code = `console.log("no ternary")`;
    const selection = Selection.cursorAt(0, 0);

    await doConvertTernaryToIfElse(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundTernaryToConvert
    );
  });

  async function doConvertTernaryToIfElse(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const [write, getCode] = createWriteInMemory(code);
    await convertTernaryToIfElse(code, selection, write, showErrorMessage);
    return getCode();
  }
});
