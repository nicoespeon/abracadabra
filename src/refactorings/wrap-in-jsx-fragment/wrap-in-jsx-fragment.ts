import * as t from "../../ast";
import { Selection } from "../../editor/selection";
import { COMMANDS, EditorCommand, RefactoringState } from "../../refactorings";

export function wrapInJsxFragment(state: RefactoringState): EditorCommand {
  if (state.state !== "new") return COMMANDS.doNothing();

  const { code, selection } = state;
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    return COMMANDS.showErrorICant("wrap in JSX fragment");
  }

  return COMMANDS.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path) => {
      const extra = path.node.extra;
      const fragment = t.jsxFragment(
        t.jsxOpeningFragment(),
        t.jsxClosingFragment(),
        [{ ...path.node, extra: { parenthesized: false } }]
      );

      t.replaceWithPreservingComments(path, { ...fragment, extra });
      path.stop();
    })
  );
}

export function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<t.JSXElement>) => void
): t.Visitor {
  return {
    JSXElement(path) {
      if (!selection.isInsidePath(path)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      onMatch(path);
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

      result = true;
    }
  });

  return result;
}
