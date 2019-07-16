import {
  DelegateToEditor,
  EditorCommand
} from "../editor/i-delegate-to-editor";
import { renameSymbol } from "./rename-symbol";

describe("Rename Symbol", () => {
  it("should delegate the work to the editor", async () => {
    const delegateToEditor: DelegateToEditor = jest.fn();

    await renameSymbol(delegateToEditor);

    expect(delegateToEditor).toBeCalledWith(EditorCommand.RenameSymbol);
  });
});
