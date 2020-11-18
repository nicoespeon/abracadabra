import { Editor, Command, Result } from "../../editor/editor";
import * as t from "../../ast";

export { renameSymbol };

async function renameSymbol(editor: Editor) {
  // Editor built-in rename works fine => ok to delegate the work for now.
  const result = await editor.delegate(Command.RenameSymbol);

  if (result === Result.NotSupported) {
    const selectedSymbol = findSelectedSymbol(editor);
    await selectedSymbol.rename();
  }
}

function findSelectedSymbol(editor: Editor): Symbol {
  let result = new Nothing();

  const { code, selection } = editor;
  const ast = t.parse(code);
  t.traverseAST(ast, {
    Identifier(path) {
      if (!selection.isInsidePath(path)) return;
      result = new Identifier(editor, ast, path);
    }
  });

  return result;
}

interface Symbol {
  rename(): Promise<void>;
}

class Identifier implements Symbol {
  constructor(
    private editor: Editor,
    private ast: t.File,
    private path: t.NodePath<t.Identifier>
  ) {}

  async rename() {
    const newName = await this.editor.askUserInput(this.value);
    if (!newName) return;

    this.path.scope.rename(this.value, newName);
    await this.editor.write(t.print(this.ast));
  }

  private get value(): string {
    return this.path.node.name;
  }
}

class Nothing implements Symbol {
  async rename() {}
}
