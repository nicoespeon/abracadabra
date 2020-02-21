import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { last } from "../../array-helpers";
import * as t from "../../ast";

export { removeRedundantElse, hasRedundantElse };

async function removeRedundantElse(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFoundRedundantElse);
    return;
  }

  await editor.write(updatedCode.code);
}

function hasRedundantElse(ast: t.AST, selection: Selection): boolean {
  let result = false;

  t.traverseAST(ast, createVisitor(selection, () => (result = true)));

  return result;
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path: t.NodePath<any>) => {
      const { node } = path;

      const elseBranch = node.alternate;
      node.alternate = null;
      path.replaceWithMultiple([node, ...t.getStatements(elseBranch)]);
      path.stop();
    })
  );
}

function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<any>) => void
): t.Visitor {
  return {
    IfStatement(path) {
      const { node } = path;
      if (!selection.isInsideNode(node)) return;

      const ifBranch = node.consequent;
      if (!t.isBlockStatement(ifBranch)) return;
      if (!hasExitStatement(ifBranch)) return;

      const elseBranch = node.alternate;
      if (!elseBranch) return;

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
    IfStatement(childPath) {
      const { node } = childPath;
      if (!selection.isInsidePath(childPath)) return;

      const ifBranch = node.consequent;
      if (!t.isBlockStatement(ifBranch)) return;
      if (!hasExitStatement(ifBranch)) return;

      const elseBranch = node.alternate;
      if (!elseBranch) return;

      result = true;
      childPath.stop();
    }
  });

  return result;
}

function hasExitStatement(node: t.BlockStatement): boolean {
  const lastStatement = last(node.body);

  return (
    t.isReturnStatement(lastStatement) || t.isThrowStatement(lastStatement)
  );
}
