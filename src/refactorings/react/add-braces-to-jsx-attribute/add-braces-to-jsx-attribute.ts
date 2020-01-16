import { Editor, Code, ErrorReason } from "../../../editor/editor";
import { Selection } from "../../../editor/selection";
import * as t from "../../../ast";

export { addBracesToJsxAttribute, hasJsxAttributeToAddBracesTo };

async function addBracesToJsxAttribute(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFoundJsxAttributeToAddBracesTo);
    return;
  }

  await editor.write(updatedCode.code);
}

function hasJsxAttributeToAddBracesTo(
  ast: t.AST,
  selection: Selection
): boolean {
  let hasJsxAttributeToAddBracesTo = false;

  t.traverseAST(ast, {
    JSXAttribute(path) {
      if (!selection.isInsidePath(path)) {
        return;
      }
      const isStringLiteral = t.isStringLiteral(path.node.value);
      hasJsxAttributeToAddBracesTo = isStringLiteral;
    }
  });

  return hasJsxAttributeToAddBracesTo;
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  const result = t.transformAST(ast, {
    JSXAttribute(path) {
      if (!selection.isInsidePath(path)) {
        return;
      }
      path.node.value = t.jsxExpressionContainer(path.node.value);
      path.stop();
    }
  });

  return result;
}
