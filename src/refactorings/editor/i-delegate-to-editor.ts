export { DelegateToEditor, EditorCommand };

type DelegateToEditor = (command: EditorCommand) => Promise<void>;

enum EditorCommand {
  RenameSymbol
}
