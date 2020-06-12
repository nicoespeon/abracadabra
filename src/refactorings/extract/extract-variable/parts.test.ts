import { Parts } from "./parts";

import { Selection } from "../../../editor/selection";
import { Position } from "../../../editor/position";

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
});
