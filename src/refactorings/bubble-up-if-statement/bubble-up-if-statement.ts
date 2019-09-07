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

      const allSiblingStatements = [
        ...ast.getPreviousSiblingStatements(path),
        ...ast.getNextSiblingStatements(path)
      ];

      const newParentIfAlternate = node.alternate
        ? ast.blockStatement([
            ast.ifStatement(parentTest, node.alternate, parentAlternate)
          ])
        : allSiblingStatements.length > 0
        ? ast.blockStatement([
            ast.ifStatement(
              parentTest,
              ast.blockStatement(allSiblingStatements)
            )
          ])
        : parentIf.alternate;

      parentIfPath.replaceWith(
        ast.ifStatement(node.test, parentIf.consequent, newParentIfAlternate)
      );
      parentIfPath.stop();

      const consequentBody = ast.isBlockStatement(node.consequent)
        ? node.consequent.body
        : [node.consequent];

      path.replaceWith(
        ast.ifStatement(
          parentTest,
          ast.blockStatement([
            ...ast.getPreviousSiblingStatements(path),
            ...consequentBody,
            ...ast.getNextSiblingStatements(path)
          ]),
          parentAlternate
        )
      );
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
