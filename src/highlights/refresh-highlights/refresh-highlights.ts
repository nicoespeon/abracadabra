import * as t from "../../ast";
import { Editor } from "../../editor/editor";
import { Selection } from "../../editor/selection";

export async function refreshHighlights(editor: Editor): Promise<void> {
  const { code } = editor;

  const sources = editor.highlightSourcesForCurrentFile();

  const highlights: { source: Selection; bindings: Selection[] }[] = [];

  t.parseAndTraverseCode(code, {
    Identifier(path) {
      if (!t.isSelectablePath(path)) return;

      const match = sources.find((source) =>
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

  highlights.forEach(({ source, bindings }) => {
    editor.removeHighlight(source);
    editor.highlight(source, bindings);
  });
}
