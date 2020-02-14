import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { addBracesToArrowFunction, hasArrowFunctionToAddBracesVisitorFactory };

async function addBracesToArrowFunction(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFoundArrowFunctionToAddBraces);
    return;
  }

  await editor.write(updatedCode.code);
}

function hasArrowFunctionToAddBracesVisitorFactory(
  selection: Selection,
  onMatch: (path: t.NodePath<any>) => void
): t.Visitor {
  return createVisitor(selection, onMatch);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, path => {
      // Duplicate this type guard so TS can infer the type properly
      if (t.isBlockStatement(path.node.body)) return;

      const blockStatement = t.blockStatement([
        t.returnStatement(path.node.body)
      ]);
      path.node.body = blockStatement;
    })
  );
}

function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<t.ArrowFunctionExpression>) => void
): t.Visitor {
  return {
    ArrowFunctionExpression(path) {
      if (!selection.isInsidePath(path)) return;
      if (t.isBlockStatement(path.node.body)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      onMatch(path);
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
    ArrowFunctionExpression(childPath) {
      if (!selection.isInsidePath(childPath)) return;
      if (t.isBlockStatement(childPath.node.body)) return;

      result = true;
      childPath.stop();
    }
  });

  return result;
}
