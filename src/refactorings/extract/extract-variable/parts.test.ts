import { Parts } from "./parts";

import { Selection } from "../../../editor/selection";
import { Position } from "../../../editor/position";

describe("Parts", () => {
  it("should identify different parts of a string", () => {
    const code = "Hello world!";
    const selection = new Selection([0, 6], [0, 11]);
    const offset = new Position(0, 0);

    const { left, value, right } = new Parts(code, selection, offset);

    expect(left).toBe("Hello ");
    expect(value).toBe("world");
    expect(right).toBe("!");
  });
});
