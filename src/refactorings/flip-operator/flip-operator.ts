import * as t from "../../ast";
import { Editor, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";

export async function flipOperator(editor: Editor) {
  const { code, selection } = editor;
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindOperatorToFlip);
    return;
  }

  await editor.write(updatedCode.code);
}

const flippedOperators = {
  "==": "==",
  "===": "===",
  "!=": "!=",
  "!==": "!==",
  ">": "<",
  "<": ">",
  ">=": "<=",
  "<=": ">="
} as const;

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path) => {
      const { node } = path;
      [node.left, node.right] = [node.right, node.left as t.Expression];
      node.operator =
        flippedOperators[node.operator as keyof typeof flippedOperators];
    })
  );
}

export function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<t.BinaryExpression>) => void
): t.Visitor {
  return {
    BinaryExpression(path) {
      if (!selection.isInsidePath(path)) return;
      if (!(path.node.operator in flippedOperators)) return;

      onMatch(path);
    }
  };
}
