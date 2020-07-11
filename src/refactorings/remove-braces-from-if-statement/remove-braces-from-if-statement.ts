import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { Position } from "../../editor/position";
import * as t from "../../ast";

export {
  removeBracesFromIfStatement,
  createVisitor as hasIfStatementWithBraces
};

async function removeBracesFromIfStatement(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindBracesToRemoveFromIfStatement);
    return;
  }

  await editor.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path) => {
      if (!t.isSelectableNode(path.node.consequent)) return;
      if (isSelectionBefore(selection, path.node.consequent)) {
        path.node.consequent = statementWithoutBraces(path.node.consequent);
        return;
      }

      if (path.node.alternate) {
        path.node.alternate = statementWithoutBraces(path.node.alternate);
      }

      path.stop();
    })
  );
}

function isSelectionBefore(
  selection: Selection,
  statement: t.Selectable<t.Statement>
): boolean {
  const endOfStatement = Position.fromAST(statement.loc.end);
  return selection.start.isBefore(endOfStatement);
}

function statementWithoutBraces(node: t.Statement): t.Statement {
  return t.isBlockStatement(node) ? node.body[0] : node;
}

function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<t.IfStatement>) => void
): t.Visitor {
  return {
    IfStatement(path) {
      if (!selection.isInsidePath(path)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      if (!hasSingleStatementBlock(path, selection)) return;

      onMatch(path);
    }
  };
}

function hasSingleStatementBlock(
  path: t.NodePath<t.IfStatement>,
  selection: Selection
): boolean {
  const { consequent, alternate } = path.node;
  const selectedBranchNode =
    t.isSelectableNode(consequent) && isSelectionBefore(selection, consequent)
      ? consequent
      : alternate;

  if (!selectedBranchNode) return false;

  if (t.isBlockStatement(selectedBranchNode)) {
    return selectedBranchNode.body.length < 2;
  } else {
    return false;
  }
}

function hasChildWhichMatchesSelection(
  path: t.NodePath,
  selection: Selection
): boolean {
  let result = false;

  path.traverse({
    IfStatement(childPath) {
      if (!selection.isInsidePath(childPath)) return;

      if (!hasSingleStatementBlock(childPath, selection)) return;

      result = true;
      childPath.stop();
    }
  });

  return result;
}
