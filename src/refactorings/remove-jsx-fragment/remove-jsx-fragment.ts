import * as t from "../../ast";
import { Selection } from "../../editor/selection";
import { COMMANDS, EditorCommand, RefactoringState } from "../../refactorings";

export function removeJsxFragment(state: RefactoringState): EditorCommand {
  if (state.state !== "new") return COMMANDS.doNothing();

  const { code, selection } = state;
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    return COMMANDS.showErrorDidNotFind("JSX fragment to remove");
  }

  return COMMANDS.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path, child) => {
      t.replaceWithPreservingComments(path, child);
    })
  );
}

export function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath, child: t.Node) => void
): t.Visitor {
  return {
    JSXFragment(path) {
      if (!selection.isInsidePath(path)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      const { children } = path.node;
      const jsxElements = children.filter((child) => t.isJSXElement(child));
      if (jsxElements.length !== 1) return;

      onMatch(path, jsxElements[0]);
      path.stop();
    }
  };
}

function hasChildWhichMatchesSelection(
  path: t.NodePath,
  selection: Selection
): boolean {
  let result = false;

  path.traverse({
    JSXElement(childPath) {
      if (!selection.isInsidePath(childPath)) return;

      const { children } = childPath.node;
      const jsxElements = children.filter((child) => t.isJSXElement(child));
      if (jsxElements.length !== 1) return;

      result = true;
    }
  });

  return result;
}
