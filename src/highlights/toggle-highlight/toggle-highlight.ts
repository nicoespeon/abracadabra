import * as t from "../../ast";
import { Editor, Selection } from "../../editor";

export async function toggleHighlight(editor: Editor): Promise<void> {
  const { code, selection } = editor;

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

  if (!result) return;

  const existingHighlight = editor.findHighlight(result.source);
  if (existingHighlight) {
    editor.removeHighlight(existingHighlight);
  } else {
    editor.highlight(result.source, result.bindings);
  }
}
