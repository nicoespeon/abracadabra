import { Editor, ErrorReason } from "../../../editor/editor";
import { Selection } from "../../../editor/selection";
import * as t from "../../../ast";

export { extractType };

async function extractType(editor: Editor) {
  const { code, selection } = editor;
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindTypeToExtract);
    return;
  }

  await editor.write(updatedCode.code);
  // TODO: rename extracted type
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path) => {
      const pathWhereToDeclareType = t.findAncestorThatCanHaveVariableDeclaration(
        path
      );
      if (!pathWhereToDeclareType) return;

      const typeIdentifier = t.identifier("Extracted");
      const typeDeclaration = t.tsTypeAliasDeclaration(
        typeIdentifier,
        null,
        path.node.typeAnnotation
      );

      pathWhereToDeclareType.insertBefore(typeDeclaration);
      // @ts-expect-error It seems genericTypeAnnotation was typed with Flow in mind, but it works with TS
      path.node.typeAnnotation = t.genericTypeAnnotation(typeIdentifier);
    })
  );
}

function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<t.TSTypeAnnotation>) => void
): t.Visitor {
  return {
    TSTypeAnnotation(path) {
      // TODO: use selection
      onMatch(path);
    }
  };
}
