import { Parts } from "./parts";
import { Position } from "../../../editor/position";
import { Selection } from "../../../editor/selection";

describe("Parts", () => {
  it("should identify different parts of a Code", () => {
    const code = "Hello world!";
    const selection = new Selection([0, 6], [0, 11]);

    const { before, selected, after } = new Parts(code, selection);

    expect(before).toBe("Hello ");
    expect(selected).toBe("world");
    expect(after).toBe("!");
  });

  it("should take offset into account", () => {
    const code = "Hello world!";
    const selection = new Selection([1, 8], [1, 13]);
    const offset = new Position(1, 2);

    const { before, selected, after } = new Parts(code, selection, offset);

    expect(before).toBe("Hello ");
    expect(selected).toBe("world");
    expect(after).toBe("!");
  });

  // This doesn't work yet for multi-lines code because we don't support it.
  it.skip("should work on a single-line selection of a multi-lines code", () => {
    const code = `Hello world!
How are you doing?
I'm fine!`;
    const selection = new Selection([1, 4], [1, 11]);

    const { before, selected, after } = new Parts(code, selection);

    expect(before).toBe("Hello world!\nHow");
    expect(selected).toBe("are you");
    expect(after).toBe("doing?\nI'm fine!");
  });
});
