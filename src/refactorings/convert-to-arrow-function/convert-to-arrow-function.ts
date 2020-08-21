import { Editor, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { convertToArrowFunction, createVisitor };

async function convertToArrowFunction(editor: Editor) {
  const { code, selection } = editor;
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindFunctionDeclarationToConvert);
    return;
  }

  await editor.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path) => {
      const { node } = path;
      const name = node.id ? node.id.name : "converted";
      const identifier = t.identifier(name);

      const arrowFunctionExpression = t.arrowFunctionExpression(
        node.params,
        node.body,
        node.async
      );
      arrowFunctionExpression.returnType = node.returnType;
      arrowFunctionExpression.typeParameters = node.typeParameters;

      const declarator = t.variableDeclarator(
        identifier,
        arrowFunctionExpression
      );

      path.replaceWith(t.variableDeclaration("const", [declarator]));

      path.stop();
    })
  );
}

function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<t.FunctionDeclaration>) => void
): t.Visitor {
  return {
    FunctionDeclaration(path) {
      if (!selection.isInsidePath(path)) return;

      onMatch(path);
    }
  };
}
