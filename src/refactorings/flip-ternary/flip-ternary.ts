import * as t from "../../ast";
import { Editor, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";

export async function flipTernary(editor: Editor) {
  const { code, selection } = editor;
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindTernaryToFlip);
    return;
  }

  await editor.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path: t.NodePath<t.ConditionalExpression>) => {
      const { node } = path;
      const ifBranch = node.consequent;
      const elseBranch = node.alternate;
      node.consequent = elseBranch;
      node.alternate = ifBranch;
      node.test = t.getNegatedIfTest(node.test);
    })
  );
}

export function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<t.ConditionalExpression>) => void
): t.Visitor {
  return {
    ConditionalExpression(path) {
      const { node } = path;
      if (!selection.isInsideNode(node)) return;

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
    ConditionalExpression(childPath) {
      if (!selection.isInsidePath(childPath)) return;

      result = true;
      childPath.stop();
    }
  });

  return result;
}
