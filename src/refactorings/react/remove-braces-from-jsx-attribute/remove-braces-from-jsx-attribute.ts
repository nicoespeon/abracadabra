import { Editor, Code, ErrorReason } from "../../../editor/editor";
import { Selection } from "../../../editor/selection";
import * as t from "../../../ast";

export {
  removeBracesFromJsxAttribute,
  hasBracesToRemoveFromJsxAttributeVisitorFactory
};

async function removeBracesFromJsxAttribute(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFoundBracesToRemove);
    return;
  }

  await editor.write(updatedCode.code);
}

function hasBracesToRemoveFromJsxAttributeVisitorFactory(
  selection: Selection,
  onMatch: (path: t.NodePath<any>) => void
): t.Visitor {
  return createVisitor(selection, path => {
    if (
      t.isJSXAttribute(path.parent) &&
      t.isStringLiteral(path.node.expression)
    ) {
      onMatch(path);
    }
  });
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, path => {
      if (
        t.isJSXAttribute(path.parent) &&
        t.isStringLiteral(path.node.expression)
      ) {
        path.parent.value = t.stringLiteral(path.node.expression.value);
      }
    })
  );
}

function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<t.JSXExpressionContainer>) => void
): t.Visitor {
  return {
    JSXExpressionContainer(path) {
      if (!selection.isInsidePath(path)) return;

      onMatch(path);
      path.stop();
    }
  };
}
