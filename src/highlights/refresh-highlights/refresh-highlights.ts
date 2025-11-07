import * as t from "../../ast";
import { Selection } from "../../editor/selection";
import { Decoration } from "../../highlights/highlights";
import { COMMANDS, EditorCommand, RefactoringState } from "../../refactorings";

export function refreshHighlights(state: RefactoringState): EditorCommand {
  const { code, highlightSources } = state;

  const highlights: {
    source: Selection;
    bindings: Selection[];
    decoration?: Decoration;
  }[] = [];

  t.parseAndTraverseCode(code, {
    Identifier(path) {
      if (!t.isSelectablePath(path)) return;

      const match = highlightSources.find((source) =>
        source.isEqualTo(Selection.fromAST(path.node.loc))
      );
      if (!match) return;

      highlights.push({
        source: match,
        bindings: t
          .selectableReferencesInScope(path)
          .map(({ node }) => Selection.fromAST(node.loc))
      });
    }
  });

  return COMMANDS.refreshHighlights(highlights);
}
