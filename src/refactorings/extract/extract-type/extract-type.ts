import { Command, Editor, ErrorReason } from "../../../editor/editor";
import { Selection } from "../../../editor/selection";
import { Position } from "../../../editor/position";
import * as t from "../../../ast";

export { extractType };

async function extractType(editor: Editor) {
  const { code, selection } = editor;
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindTypeToExtract);
    return;
  }

  // When we create interfaces it generates a double `;` by mistake
  await editor.write(
    updatedCode.code.replace(/;;/gm, ";"),
    selection.start
      .putAtStartOfLine()
      .goToNextNthWordInCode(2, updatedCode.code)
  );
  await editor.delegate(Command.RenameSymbol);
}

function updateCode(
  ast: t.AST,
  selection: Selection
): t.Transformed & { newNodePosition: Position } {
  let newNodePosition = selection.start;

  const result = t.transformAST(
    ast,
    createVisitor(selection, (path) => {
      const pathWhereToDeclareType = t.findAncestorThatCanHaveVariableDeclaration(
        path
      );
      if (!pathWhereToDeclareType) return;

      const typeIdentifier = t.identifier("Extracted");
      let typeDeclaration: t.Node = t.tsTypeAliasDeclaration(
        typeIdentifier,
        null,
        path.node.typeAnnotation
      );

      if (t.isTSTypeLiteral(path.node.typeAnnotation)) {
        typeDeclaration = t.tsInterfaceDeclaration(
          typeIdentifier,
          null,
          null,
          t.tsInterfaceBody(path.node.typeAnnotation.members)
        );
      }

      pathWhereToDeclareType.insertBefore(typeDeclaration);
      // @ts-expect-error It seems genericTypeAnnotation was typed with Flow in mind, but it works with TS
      path.node.typeAnnotation = t.genericTypeAnnotation(typeIdentifier);
    })
  );

  return { ...result, newNodePosition };
}

function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<t.TSTypeAnnotation>) => void
): t.Visitor {
  return {
    TSTypeAnnotation(path) {
      if (!selection.isInsidePath(path)) return;

      onMatch(path);
    }
  };
}
