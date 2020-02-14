import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { Position } from "../../editor/position";
import * as t from "../../ast";

export { addBracesToIfStatement, hasIfStatementToAddBracesVisitorFactory };

async function addBracesToIfStatement(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFoundIfStatementToAddBraces);
    return;
  }

  await editor.write(updatedCode.code);
}

function hasIfStatementToAddBracesVisitorFactory(
  selection: Selection,
  onMatch: (path: t.NodePath<any>) => void
): t.Visitor {
  return createVisitor(selection, onMatch);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, path => {
      if (!t.isSelectableNode(path.node.consequent)) return;
      const endOfConsequent = Position.fromAST(path.node.consequent.loc.end);

      if (selection.start.isBefore(endOfConsequent)) {
        path.node.consequent = statementWithBraces(path.node.consequent);
        return;
      }

      if (path.node.alternate) {
        path.node.alternate = statementWithBraces(path.node.alternate);
      }
    })
  );
}

function statementWithBraces(node: t.Statement): t.Statement {
  return t.isBlockStatement(node) ? node : t.blockStatement([node]);
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
    IfStatement(childPath) {
      if (!selection.isInsidePath(childPath)) return;

      result = true;
      childPath.stop();
    }
  });

  return result;
}
