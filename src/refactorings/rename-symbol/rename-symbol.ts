import { Editor, Command, Result, ErrorReason } from "../../editor/editor";
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
  let result: Symbol = new Nothing();

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

    const oldName = this.path.node.name;
    const pathToRename = this.path;
    const value = this.value;

    const { code, hasCodeChanged } = t.transformAST(this.ast, {
      Identifier(path) {
        if (path !== pathToRename) return;

        const { parentPath } = pathToRename;
        if (parentPath.isObjectProperty()) {
          if (parentPath.node.shorthand) {
            parentPath.replaceWith(
              t.objectProperty(t.identifier(oldName), t.identifier(newName))
            );
          } else if (parentPath.node.key === pathToRename.node) {
            return;
          }
        }

        pathToRename.scope.rename(value, newName);
      }
    });

    if (!hasCodeChanged) {
      this.editor.showError(ErrorReason.DidNotFindIdentifiersToRename);
      return;
    }

    await this.editor.write(code);
  }

  private get value(): string {
    return this.path.node.name;
  }
}

class Nothing implements Symbol {
  async rename() {}
}
