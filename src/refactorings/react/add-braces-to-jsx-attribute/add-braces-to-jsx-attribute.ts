import { Editor, Code, ErrorReason } from "../../../editor/editor";
import { Selection } from "../../../editor/selection";
import * as t from "../../../ast";

export { addBracesToJsxAttribute, hasJsxAttributeToAddBracesToVisitorFactory };

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

function hasJsxAttributeToAddBracesToVisitorFactory(
  selection: Selection,
  onMatch: (path: t.NodePath<any>) => void
): t.Visitor {
  return createVisitor(selection, onMatch);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, path => {
      path.node.value = t.jsxExpressionContainer(path.node.value);
    })
  );
}

function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<any>) => void
): t.Visitor {
  return {
    JSXAttribute(path) {
      if (!selection.isInsidePath(path)) {
        return;
      }

      if (t.isStringLiteral(path.node.value)) {
        onMatch(path);
      }
      path.stop();
    }
  };
}
