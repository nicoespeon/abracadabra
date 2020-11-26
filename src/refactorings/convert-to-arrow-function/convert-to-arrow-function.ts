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

      const variableDeclaration = t.variableDeclaration("const", [declarator]);
      // @ts-expect-error Recast does use a `comments` attribute.
      variableDeclaration.comments = node.comments;

      path.replaceWith(variableDeclaration);
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

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      onMatch(path);
    }
  };
}

function hasChildWhichMatchesSelection(
  path: t.NodePath,
  selection: Selection
): boolean {
  let result = false;

  path.traverse({
    FunctionDeclaration(childPath) {
      if (!selection.isInsidePath(childPath)) return;

      result = true;
      childPath.stop();
    }
  });

  return result;
}
