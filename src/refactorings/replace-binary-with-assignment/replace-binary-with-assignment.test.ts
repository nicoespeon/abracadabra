import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code } from "../../editor/editor";
import { replaceBinaryWithAssignment } from "./replace-binary-with-assignment";

describe("Replace Binary With Assignment Expression", () => {
  describe("should replace binary with assignment expression", () => {
    it("addition", () => {
      shouldReplaceBinaryWithAssignment({
        code: `total = total + 1;`,
        expected: `total += 1;`
      });
    });

    it("addition (identifier on the right)", () => {
      shouldReplaceBinaryWithAssignment({
        code: `total = 1 + total;`,
        expected: `total += 1;`
      });
    });

    it("addition with itself", () => {
      shouldReplaceBinaryWithAssignment({
        code: `total = total + total;`,
        expected: `total += total;`
      });
    });

    it("addition with update expression", () => {
      shouldReplaceBinaryWithAssignment({
        code: `total = total + ++total;`,
        expected: `total += ++total;`
      });
    });

    it("substraction", () => {
      shouldReplaceBinaryWithAssignment({
        code: `total = total - 1;`,
        expected: `total -= 1;`
      });
    });

    it("division", () => {
      shouldReplaceBinaryWithAssignment({
        code: `total = total / 1;`,
        expected: `total /= 1;`
      });
    });

    it("multiplication", () => {
      shouldReplaceBinaryWithAssignment({
        code: `total = total * 1;`,
        expected: `total *= 1;`
      });
    });

    it("modulus", () => {
      shouldReplaceBinaryWithAssignment({
        code: `total = total % 1;`,
        expected: `total %= 1;`
      });
    });

    it("power", () => {
      shouldReplaceBinaryWithAssignment({
        code: `total = total ** 1;`,
        expected: `total **= 1;`
      });
    });

    it("left-shift", () => {
      shouldReplaceBinaryWithAssignment({
        code: `total = total << 1;`,
        expected: `total <<= 1;`
      });
    });

    it("right-shift", () => {
      shouldReplaceBinaryWithAssignment({
        code: `total = total >> 1;`,
        expected: `total >>= 1;`
      });
    });

    it("unsigned right-shift", () => {
      shouldReplaceBinaryWithAssignment({
        code: `total = total >>> 1;`,
        expected: `total >>>= 1;`
      });
    });

    it("binary bitwise operator (&)", () => {
      shouldReplaceBinaryWithAssignment({
        code: `total = total & 1;`,
        expected: `total &= 1;`
      });
    });

    it("binary bitwise operator (|)", () => {
      shouldReplaceBinaryWithAssignment({
        code: `total = total | 1;`,
        expected: `total |= 1;`
      });
    });

    it("binary bitwise operator (^)", () => {
      shouldReplaceBinaryWithAssignment({
        code: `total = total ^ 1;`,
        expected: `total ^= 1;`
      });
    });

    it("only selected expression", () => {
      shouldReplaceBinaryWithAssignment({
        code: `total[cursor] = total + 1;
fees = fees + 10;`,
        expected: `total += 1;
fees = fees + 10;`
      });
    });
  });

  describe("should not replace binary with assignment expression", () => {
    it("addition with another identifier", () => {
      shouldNotReplaceBinaryWithAssignment(`total = fees + 10;`);
    });

    it("addition with itself and other things", () => {
      shouldNotReplaceBinaryWithAssignment(`total = total + total + 10;`);
    });

    it("addition with double update expressions", () => {
      shouldNotReplaceBinaryWithAssignment(`total = ++total + ++total;`);
    });

    it("less-than", () => {
      shouldNotReplaceBinaryWithAssignment(`total = total < 10;`);
    });

    it("less-than-or-equal", () => {
      shouldNotReplaceBinaryWithAssignment(`total = total <= 10;`);
    });

    it("greater-than", () => {
      shouldNotReplaceBinaryWithAssignment(`total = total > 10;`);
    });

    it("greater-than-or-equal", () => {
      shouldNotReplaceBinaryWithAssignment(`total = total >= 10;`);
    });

    it("equal", () => {
      shouldNotReplaceBinaryWithAssignment(`total = total == 10;`);
    });

    it("not equal", () => {
      shouldNotReplaceBinaryWithAssignment(`total = total != 10;`);
    });

    it("strict equal", () => {
      shouldNotReplaceBinaryWithAssignment(`total = total === 10;`);
    });

    it("not strict equal", () => {
      shouldNotReplaceBinaryWithAssignment(`total = total !== 10;`);
    });

    it("instanceof", () => {
      shouldNotReplaceBinaryWithAssignment(`total = total instanceof Number;`);
    });

    it("in", () => {
      shouldNotReplaceBinaryWithAssignment(`total = total in [10, 20];`);
    });

    it("array pattern", () => {
      shouldNotReplaceBinaryWithAssignment(`[total] = total + 1;`);
    });

    it("substraction (identifier on the right)", () => {
      shouldNotReplaceBinaryWithAssignment(`total = 1 - total;`);
    });
  });

  it("should show an error message if refactoring can't be made", () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    const result = replaceBinaryWithAssignment({
      state: "new",
      code: editor.code,
      selection: editor.selection
    });

    expect(result.action).toBe("show error");
  });
});

function shouldReplaceBinaryWithAssignment({
  code,
  expected
}: {
  code: Code;
  expected: Code;
}) {
  const editor = new InMemoryEditor(code);
  const result = replaceBinaryWithAssignment({
    state: "new",
    code: editor.code,
    selection: editor.selection
  });

  expect(result).toMatchObject({ action: "write", code: expected });
}

function shouldNotReplaceBinaryWithAssignment(code: Code) {
  const editor = new InMemoryEditor(code);
  const result = replaceBinaryWithAssignment({
    state: "new",
    code: editor.code,
    selection: editor.selection
  });

  expect(result.action).toBe("show error");
}
