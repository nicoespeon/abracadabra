import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code, ErrorReason } from "../../editor/editor";
import { testEach } from "../../tests-helpers";
import { replaceBinaryWithAssignment } from "./replace-binary-with-assignment";

describe("Replace Binary With Assignment Expression", () => {
  testEach<{ code: Code; expected: Code }>(
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
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await replaceBinaryWithAssignment(editor);

      expect(editor.code).toBe(expected);
    }
  );

  testEach<{ code: Code }>(
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
    async ({ code }) => {
      const editor = new InMemoryEditor(code);
      const originalCode = editor.code;

      await replaceBinaryWithAssignment(editor);

      expect(editor.code).toBe(originalCode);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await replaceBinaryWithAssignment(editor);

    expect(editor.showError).toHaveBeenCalledWith(
      ErrorReason.DidNotFindBinaryExpression
    );
  });
});
