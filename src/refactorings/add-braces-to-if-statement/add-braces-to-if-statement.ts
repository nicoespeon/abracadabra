import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { addBracesToIfStatement, hasIfStatementToAddBraces };

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

function hasIfStatementToAddBraces(ast: t.AST, selection: Selection): boolean {
  let result = false;
  t.traverseAST(ast, createVisitor(selection, () => (result = true)));

  return result;
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, path => {
      path.node.consequent = statementWithBraces(
        selection,
        path.node.consequent
      );
      if (path.node.alternate) {
        path.node.alternate = statementWithBraces(
          selection,
          path.node.alternate
        );
      }
    })
  );
}

function statementWithBraces(
  selection: Selection,
  node: t.Statement
): t.Statement {
  if (!selection.isInsideNode(node)) return node;
  if (t.isBlockStatement(node)) return node;
  return t.blockStatement([node]);
}

function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<t.IfStatement>) => void
): t.Visitor {
  return {
    IfStatement(path) {
      if (!selection.isInsidePath(path)) return;
      onMatch(path);
      path.stop();
    }
  };
}
