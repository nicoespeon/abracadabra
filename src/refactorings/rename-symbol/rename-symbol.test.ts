import { Command } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";

import { renameSymbol } from "./rename-symbol";

describe("Rename Symbol", () => {
  it("should delegate the work to the editor", async () => {
    const editor = new InMemoryEditor("");
    jest.spyOn(editor, "delegate");

    await renameSymbol(editor);

    expect(editor.delegate).toBeCalledWith(Command.RenameSymbol);
  });
});
