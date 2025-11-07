import * as t from "../../ast";
import { Selection } from "../../editor/selection";
import { COMMANDS, EditorCommand, RefactoringState } from "../../refactorings";

export function toggleHighlight(state: RefactoringState): EditorCommand {
  const { code, selection } = state;

  let result: { source: Selection; bindings: Selection[] } | undefined;
  t.parseAndTraverseCode(code, {
    Identifier(path) {
      if (!selection.isInsidePath(path)) return;
      if (!t.isSelectablePath(path)) return;

      result = {
        source: Selection.fromAST(path.node.loc),
        bindings: t
          .selectableReferencesInScope(path)
          .map(({ node }) => Selection.fromAST(node.loc))
      };
    }
  });

  if (!result) {
    return COMMANDS.doNothing();
  }

  return COMMANDS.toggleHighlight(result.source, result.bindings);
}
