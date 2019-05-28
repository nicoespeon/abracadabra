import { DelegateToEditor, EditorCommand } from "./i-delegate-to-editor";
import { renameSymbol } from "./rename-symbol";

describe("Rename Symbol", () => {
  it("should delegate the work to the editor", () => {
    const delegateToFakeEditor: DelegateToEditor = jest.fn();

    renameSymbol(delegateToFakeEditor);

    expect(delegateToFakeEditor).toBeCalledWith(EditorCommand.RenameSymbol);
  });
});
