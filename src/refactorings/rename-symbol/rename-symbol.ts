import * as t from "../../ast";
import { Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { COMMANDS, EditorCommand, RefactoringState } from "../../refactorings";

export function renameSymbol(state: RefactoringState): EditorCommand {
  const { code, selection } = state;

  if (state.state === "command not supported") {
    const path = findPath(code, selection);
    if (!path) return COMMANDS.showErrorDidNotFind("an identifier to rename");

    return COMMANDS.askUser(path.node.name);
  }

  if (state.state === "user response") {
    const newName = state.value;
    if (!newName) return COMMANDS.doNothing();

    const { code: newCode, hasCodeChanged } = doRenameSymbol(
      code,
      selection,
      newName
    );
    if (!hasCodeChanged) {
      return COMMANDS.showErrorDidNotFind("an identifier to rename");
    }

    return COMMANDS.write(newCode);
  }

  // Editor built-in rename works fine => ok to delegate the work for now.
  return COMMANDS.delegate("rename symbol");
}

function findPath(
  code: Code,
  selection: Selection
): t.NodePath<t.Identifier> | null {
  let result = null;

  t.traverseAST(
    t.parse(code),
    createVisitor(selection, (path) => (result = path))
  );

  return result;
}

function doRenameSymbol(code: Code, selection: Selection, newName: string) {
  return t.transformAST(
    t.parse(code),
    createVisitor(selection, (path) => {
      const { parentPath, node } = path;
      const oldName = node.name;

      if (parentPath.isObjectProperty() && parentPath.node.shorthand) {
        parentPath.replaceWith(
          t.objectProperty(t.identifier(oldName), t.identifier(newName))
        );
        return;
      }

      if (parentPath.isObjectProperty() && parentPath.node.key === node) {
        return;
      }

      path.scope.rename(oldName, newName);
    })
  );
}

function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<t.Identifier>) => void
): t.TraverseOptions {
  return {
    Identifier(path) {
      if (!selection.isInsidePath(path)) return;
      onMatch(path);
    }
  };
}
