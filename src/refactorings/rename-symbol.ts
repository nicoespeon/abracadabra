import { DelegateToEditor, EditorCommand } from "./i-delegate-to-editor";

export { renameSymbol };

function renameSymbol(delegateToEditor: DelegateToEditor) {
  // Editor built-in rename works fine => ok to delegate the work for now.
  delegateToEditor(EditorCommand.RenameSymbol);
}
