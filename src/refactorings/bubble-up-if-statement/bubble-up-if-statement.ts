import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as ast from "../../ast";

export { bubbleUpIfStatement, canBubbleUpIfStatement };

async function bubbleUpIfStatement(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(code, selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFoundNestedIf);
    return;
  }

  await editor.write(updatedCode.code);
}

function canBubbleUpIfStatement(code: Code, selection: Selection): boolean {
  return updateCode(code, selection).hasCodeChanged;
}

function updateCode(code: Code, selection: Selection): ast.Transformed {
  return ast.transform(code, {
    IfStatement(path) {
      const { node } = path;

      if (!selection.isInsidePath(path)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      const parentIfPath = ast.findParentIfPath(path);
      if (!parentIfPath) return;

      const parentIf = parentIfPath.node;
      const parentTest = parentIf.test;
      const parentAlternate = parentIf.alternate;

      const buildNestedIfStatementFor = (node: ast.Statement) =>
        buildNestedIfStatement(
          node,
          ast.getPreviousSiblingStatements(path),
          ast.getNextSiblingStatements(path),
          parentTest,
          parentAlternate
        );

      const newParentIfAlternate = node.alternate
        ? ast.blockStatement([buildNestedIfStatementFor(node.alternate)])
        : ast.hasSiblingStatement(path)
        ? ast.blockStatement([buildNestedIfStatementFor(ast.emptyStatement())])
        : parentIf.alternate;

      parentIfPath.replaceWith(
        ast.ifStatement(node.test, parentIf.consequent, newParentIfAlternate)
      );
      parentIfPath.stop();

      path.replaceWith(buildNestedIfStatementFor(node.consequent));
      path.stop();

      path.getAllPrevSiblings().forEach(path => path.remove());
      path.getAllNextSiblings().forEach(path => path.remove());
    }
  });
}

function hasChildWhichMatchesSelection(
  path: ast.NodePath,
  selection: Selection
): boolean {
  let result = false;

  path.traverse({
    IfStatement(childPath) {
      if (!selection.isInsidePath(childPath)) return;
      if (!ast.findParentIfPath(childPath)) return;

      result = true;
      childPath.stop();
    }
  });

  return result;
}

function buildNestedIfStatement(
  branch: ast.Statement,
  previousSiblingStatements: ast.Statement[],
  nextSiblingStatements: ast.Statement[],
  test: ast.IfStatement["test"],
  alternate: ast.IfStatement["alternate"]
): ast.IfStatement {
  const body = ast.isBlockStatement(branch) ? branch.body : [branch];

  return ast.ifStatement(
    test,
    ast.blockStatement([
      ...previousSiblingStatements,
      ...body,
      ...nextSiblingStatements
    ]),
    alternate
  );
}
