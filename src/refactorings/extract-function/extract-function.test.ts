import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { extractFunction } from "./extract-function";

describe("Extract Function", () => {
  it("should delegate the work to the editor", () => {
    const { code, selection } = new InMemoryEditor();

    const result = extractFunction({
      state: "new",
      code,
      selection
    });

    expect(result).toEqual({
      action: "delegate",
      command: "extract function"
    });
  });

  it("should expand selection to closest statement before extracting", () => {
    const { code, selection } =
      new InMemoryEditor(`function updateQuality(item) {
  if (item.sellIn < 11) {
    if (item.quali[start]ty < 50) {
      item.quality = item.qu[end]ality + 1;
    }
  }
}`);

    const result = extractFunction({
      state: "new",
      code,
      selection
    });

    const { selection: expectedSelection } =
      new InMemoryEditor(`function updateQuality(item) {
  if (item.sellIn < 11) {
    [start]if (item.quality < 50) {
      item.quality = item.quality + 1;
    }[end]
  }
}`);
    expect(result).toEqual({
      action: "delegate",
      command: "extract function",
      selection: expectedSelection
    });
  });

  it("should expand selection if cursor on an identifier", () => {
    const { code, selection } =
      new InMemoryEditor(`function updateQuality(item) {
  if (item.sellIn < 11) {
    if (item.quality < 50) {
      item.quali[cursor]ty = item.quality + 1;
    }
  }
}`);

    const result = extractFunction({
      state: "new",
      code,
      selection
    });

    const { selection: expectedSelection } =
      new InMemoryEditor(`function updateQuality(item) {
  if (item.sellIn < 11) {
    if (item.quality < 50) {
      [start]item.quality = item.quality + 1;[end]
    }
  }
}`);
    expect(result).toEqual({
      action: "delegate",
      command: "extract function",
      selection: expectedSelection
    });
  });

  it("should show an error if the editor does not support the refactoring", () => {
    const { code, selection } = new InMemoryEditor();

    const result = extractFunction({
      state: "command not supported",
      code,
      selection
    });

    expect(result).toEqual({
      action: "show error",
      reason: "I didn't find code to be extracted from current selection 🤔"
    });
  });
});
