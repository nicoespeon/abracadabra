import { Editor, Command } from "../../editor/editor";

export { renameSymbol };

async function renameSymbol(editor: Editor) {
  // Editor built-in rename works fine => ok to delegate the work for now.
  await editor.delegate(Command.RenameSymbol);
}
