import {
  DelegateToEditor,
  EditorCommand
} from "../../editor/i-delegate-to-editor";

export { renameSymbol };

async function renameSymbol(delegateToEditor: DelegateToEditor) {
  // Editor built-in rename works fine => ok to delegate the work for now.
  await delegateToEditor(EditorCommand.RenameSymbol);
}
