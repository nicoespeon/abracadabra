import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { convertTernaryToIfElse } from "./convert-ternary-to-if-else";

describe("Convert Ternary to If/Else", () => {
  let showErrorMessage: Editor["showError"];

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; selection: Selection; expected: Code }>(
    "should convert ternary to if/else",
    [
      {
        description: "return statement",
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
      },
      {
        description: "assignment expression",
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
      },
      {
        description: "assignment expression with different operator",
        code: `function getTotal(daysInAdvance) {
  let total = 10;
  total += daysInAdvance > 10 ? 2 : 5;
  return total;
}`,
        selection: Selection.cursorAt(2, 16),
        expected: `function getTotal(daysInAdvance) {
  let total = 10;

  if (daysInAdvance > 10) {
    total += 2;
  } else {
    total += 5;
  }

  return total;
}`
      },
      {
        description: "variable declaration",
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
      },
      {
        description: "nested ternary, cursor on wrapping ternary",
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
      },
      {
        description:
          "nested ternary on consequent branch, cursor on nested ternary",
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
      },
      {
        description:
          "nested ternary on alternate branch, cursor on nested ternary",
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
      },
      {
        description:
          "nested ternary on both branches, cursor on consequent nested ternary",
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
      },
      {
        description:
          "nested ternary on both branches, cursor on alternate nested ternary",
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
      },
      {
        description: "deeply nested ternary, cursor on nested ternary",
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
      },
      {
        description: "deeply nested ternary, assignment expression",
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
      },
      {
        description: "deeply nested ternary, variable declaration",
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
    ],
    async ({ code, selection, expected }) => {
      const result = await doConvertTernaryToIfElse(code, selection);

      expect(result).toBe(expected);
    }
  );

  it("should show an error message if selection has no valid ternary to convert", async () => {
    const code = `console.log("no ternary")`;
    const selection = Selection.cursorAt(0, 0);

    await doConvertTernaryToIfElse(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFindTernaryToConvert
    );
  });

  async function doConvertTernaryToIfElse(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const editor = new InMemoryEditor(code);
    editor.showError = showErrorMessage;
    await convertTernaryToIfElse(code, selection, editor);
    return editor.code;
  }
});
