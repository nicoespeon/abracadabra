import { Editor, Code, ErrorReason } from "../../../editor/editor";
import { Selection } from "../../../editor/selection";
import * as t from "../../../ast";

export { removeBracesFromJsxAttribute, hasBracesToRemoveFromJsxAttribute };

async function removeBracesFromJsxAttribute(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindBracesToRemove);
    return;
  }

  await editor.write(updatedCode.code);
}

function hasBracesToRemoveFromJsxAttribute(
  ast: t.AST,
  selection: Selection
): boolean {
  let isParentJsxAttribute = false;
  let isJsxExpressionStringLiteral = false;

  t.traverseAST(ast, {
    JSXExpressionContainer(path) {
      if (!selection.isInsidePath(path)) return;

      isParentJsxAttribute = t.isJSXAttribute(path.parent);
      isJsxExpressionStringLiteral = t.isStringLiteral(path.node.expression);
    }
  });

  return isParentJsxAttribute && isJsxExpressionStringLiteral;
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(ast, {
    JSXExpressionContainer(path) {
      if (
        selection.isInsidePath(path) &&
        t.isJSXAttribute(path.parent) &&
        t.isStringLiteral(path.node.expression)
      ) {
        path.parent.value = t.stringLiteral(path.node.expression.value);
      }
    }
  });
}
