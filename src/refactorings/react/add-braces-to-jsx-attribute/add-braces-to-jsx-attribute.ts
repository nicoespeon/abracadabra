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
      hasJsxAttributeToAddBracesTo = t.isStringLiteral(path.node.value);
    }
  });

  return hasJsxAttributeToAddBracesTo;
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(ast, {
    JSXAttribute(path) {
      if (!selection.isInsidePath(path)) {
        return;
      }

      if (t.isStringLiteral(path.node.value)) {
        // Wrap the string literal in a JSX Expression
        path.node.value = t.jsxExpressionContainer(path.node.value);
      }
      path.stop();
    }
  });
}
