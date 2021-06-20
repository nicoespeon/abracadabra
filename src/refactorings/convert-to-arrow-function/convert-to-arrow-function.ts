import { Editor, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { convertToArrowFunction, createVisitor };

async function convertToArrowFunction(editor: Editor) {
  const { code, selection } = editor;
  const { updatedCode, hasReferenceBefore } = updateCode(
    t.parse(code),
    selection
  );

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindFunctionDeclarationToConvert);
    return;
  }

  if (hasReferenceBefore) {
    editor.showError(
      ErrorReason.CantConvertFunctionDeclarationBecauseUsedBefore
    );
    return;
  }

  await editor.write(updatedCode.code);
}

function updateCode(
  ast: t.AST,
  selection: Selection
): { updatedCode: t.Transformed; hasReferenceBefore: boolean } {
  let hasReferenceBefore = false;
  const updatedCode = t.transformAST(
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

      if (t.isSelectablePath(path)) {
        const pathSelection = Selection.fromAST(path.node.loc);
        hasReferenceBefore = t.referencesInScope(path).some((reference) => {
          if (!t.isSelectablePath(reference)) return false;
          const referenceSelection = Selection.fromAST(reference.node.loc);
          return (
            !referenceSelection.isEqualTo(pathSelection) &&
            referenceSelection.startsBefore(pathSelection)
          );
        });
      }

      path.replaceWith(variableDeclaration);
      path.stop();
    })
  );

  return { updatedCode, hasReferenceBefore };
}

function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<t.FunctionDeclaration>) => void
): t.Visitor {
  return {
    FunctionDeclaration(path) {
      // It seems a function declaration inside a named export may have no loc.
      // Use the named export loc in that situation.
      if (
        t.isExportNamedDeclaration(path.parent) &&
        !t.isSelectableNode(path.node)
      ) {
        path.node.loc = path.parent.loc;
      }

      if (!selection.isInsidePath(path)) return;
      if (selection.isInsidePath(path.get("body"))) return;

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
