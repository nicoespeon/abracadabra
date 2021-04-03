import { Code, ErrorReason } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { convertTernaryToIfElse } from "./convert-ternary-to-if-else";

describe("Convert Ternary to If/Else", () => {
  testEach<{ code: Code; expected: Code }>(
    "should convert ternary to if/else",
    [
      {
        description: "return statement",
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
      },
      {
        description: "assignment expression",
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
      },
      {
        description: "assignment expression with different operator",
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
      },
      {
        description: "variable declaration",
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
      },
      {
        description: "whole ternary selected",
        code: `[start]let publishesNeedingLink = args.forcelink ? page.directives : page.findPublishesLackingLinkInPage();[end]`,
        expected: `let publishesNeedingLink;

if (args.forcelink) {
  publishesNeedingLink = page.directives;
} else {
  publishesNeedingLink = page.findPublishesLackingLinkInPage();
}`
      },
      {
        description: "nested ternary, cursor on wrapping ternary",
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
      },
      {
        description:
          "nested ternary on consequent branch, cursor on nested ternary",
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
      },
      {
        description:
          "nested ternary on alternate branch, cursor on nested ternary",
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
      },
      {
        description:
          "nested ternary on both branches, cursor on consequent nested ternary",
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
      },
      {
        description:
          "nested ternary on both branches, cursor on alternate nested ternary",
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
      },
      {
        description: "deeply nested ternary, cursor on nested ternary",
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
      },
      {
        description: "deeply nested ternary, assignment expression",
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
      },
      {
        description: "deeply nested ternary, variable declaration",
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
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await convertTernaryToIfElse(editor);

      expect(editor.code).toBe(expected);
    }
  );

  it("should show an error message if selection has no valid ternary to convert", async () => {
    const code = `console.log("no ternary")`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await convertTernaryToIfElse(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindTernaryToConvert
    );
  });

  it("should not convert ternary in variable declaration if there are other declarations", async () => {
    const code = `let links = args.forceLink[cursor] ? [] : null, isValid = args.forceLink ? true : false`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await convertTernaryToIfElse(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.CantConvertTernaryWithOtherDeclarations
    );
  });
});
