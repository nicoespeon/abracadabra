import { Editor, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export async function convertToTemplateLiteral(editor: Editor) {
  const { code, selection } = editor;
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindStringToConvert);
    return;
  }

  await editor.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path) => {
      const templateLiteral = t.templateLiteral(
        [t.templateElement(path.node.value.replace(/`/g, "\\`"))],
        []
      );

      if (t.isJSXAttribute(path.parentPath)) {
        // Case of <MyComponent prop="test" /> => <MyComponent prop={`test`} />
        path.replaceWith(t.jsxExpressionContainer(templateLiteral));
      } else {
        path.replaceWith(templateLiteral);
      }

      path.stop();
    })
  );
}

export function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<t.StringLiteral>) => void
): t.Visitor {
  return {
    StringLiteral(path) {
      if (!selection.isInsidePath(path)) return;

      // In that case, VS Code will handle it.
      if (t.isBinaryExpression(path.parentPath)) return;

      // If we are inside of an import statement, dont show refactoring
      if (t.isImportDeclaration(path.parentPath)) return;

      onMatch(path);
    }
  };
}
