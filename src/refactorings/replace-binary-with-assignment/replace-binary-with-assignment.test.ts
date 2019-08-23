import { Editor, ErrorReason, Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { replaceBinaryWithAssignment } from "./replace-binary-with-assignment";

describe("Replace Binary With Assignment Expression", () => {
  let showErrorMessage: Editor["showError"];

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; selection?: Selection; expected: Code }>(
    "should replace binary with assignment expression",
    [
      {
        description: "addition",
        code: `total = total + 1;`,
        expected: `total += 1;`
      },
      {
        description: "addition (identifier on the right)",
        code: `total = 1 + total;`,
        expected: `total += 1;`
      },
      {
        description: "addition with itself",
        code: `total = total + total;`,
        expected: `total += total;`
      },
      {
        description: "addition with update expression",
        code: `total = total + ++total;`,
        expected: `total += ++total;`
      },
      {
        description: "substraction",
        code: `total = total - 1;`,
        expected: `total -= 1;`
      },
      {
        description: "division",
        code: `total = total / 1;`,
        expected: `total /= 1;`
      },
      {
        description: "multiplication",
        code: `total = total * 1;`,
        expected: `total *= 1;`
      },
      {
        description: "modulus",
        code: `total = total % 1;`,
        expected: `total %= 1;`
      },
      {
        description: "power",
        code: `total = total ** 1;`,
        expected: `total **= 1;`
      },
      {
        description: "left-shift",
        code: `total = total << 1;`,
        expected: `total <<= 1;`
      },
      {
        description: "right-shift",
        code: `total = total >> 1;`,
        expected: `total >>= 1;`
      },
      {
        description: "unsigned right-shift",
        code: `total = total >>> 1;`,
        expected: `total >>>= 1;`
      },
      {
        description: "binary bitwise operator (&)",
        code: `total = total & 1;`,
        expected: `total &= 1;`
      },
      {
        description: "binary bitwise operator (|)",
        code: `total = total | 1;`,
        expected: `total |= 1;`
      },
      {
        description: "binary bitwise operator (^)",
        code: `total = total ^ 1;`,
        expected: `total ^= 1;`
      },
      {
        description: "only selected expression",
        code: `total = total + 1;
fees = fees + 10;`,
        expected: `total += 1;
fees = fees + 10;`
      }
    ],
    async ({ code, selection = Selection.cursorAt(0, 0), expected }) => {
      const result = await doReplaceBinaryWithAssignmentExpression(
        code,
        selection
      );

      expect(result).toBe(expected);
    }
  );

  testEach<{ code: Code; selection?: Selection }>(
    "should not replace binary with assignment expression",
    [
      {
        description: "addition with another identifier",
        code: `total = fees + 10;`
      },
      {
        description: "addition with itself and other things",
        code: `total = total + total + 10;`
      },
      {
        description: "addition with double update expressions",
        code: `total = ++total + ++total;`
      },
      {
        description: "less-than",
        code: `total = total < 10;`
      },
      {
        description: "less-than-or-equal",
        code: `total = total <= 10;`
      },
      {
        description: "greater-than",
        code: `total = total > 10;`
      },
      {
        description: "greater-than-or-equal",
        code: `total = total >= 10;`
      },
      {
        description: "equal",
        code: `total = total == 10;`
      },
      {
        description: "not equal",
        code: `total = total != 10;`
      },
      {
        description: "strict equal",
        code: `total = total === 10;`
      },
      {
        description: "not strict equal",
        code: `total = total !== 10;`
      },
      {
        description: "instanceof",
        code: `total = total instanceof Number;`
      },
      {
        description: "in",
        code: `total = total in [10, 20];`
      },
      {
        description: "array pattern",
        code: `[total] = total + 1;`
      },
      {
        description: "substraction (identifier on the right)",
        code: `total = 1 - total;`
      }
    ],
    async ({ code, selection = Selection.cursorAt(0, 0) }) => {
      const result = await doReplaceBinaryWithAssignmentExpression(
        code,
        selection
      );

      expect(result).toBe(code);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const selection = Selection.cursorAt(0, 0);

    await doReplaceBinaryWithAssignmentExpression(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundBinaryExpression
    );
  });

  async function doReplaceBinaryWithAssignmentExpression(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const editor = new InMemoryEditor(code);
    editor.showError = showErrorMessage;
    await replaceBinaryWithAssignment(code, selection, editor);
    return editor.code;
  }
});
