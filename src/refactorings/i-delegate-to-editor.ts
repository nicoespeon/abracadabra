export { DelegateToEditor, EditorCommand };

type DelegateToEditor = (command: EditorCommand) => void;

enum EditorCommand {
  RenameSymbol
}
