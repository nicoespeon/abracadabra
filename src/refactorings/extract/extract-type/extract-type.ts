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
    updatedCode.newNodePosition
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
    createVisitor(selection, (path, typeAnnotation, getNewTypeAnnotation) => {
      const pathWhereToDeclareType = t.findAncestorThatCanHaveVariableDeclaration(
        path
      );
      if (!pathWhereToDeclareType) return;

      const typeIdentifier = t.identifier("Extracted");
      let typeDeclaration: t.Node = t.tsTypeAliasDeclaration(
        typeIdentifier,
        null,
        typeAnnotation
      );

      if (t.isTSTypeLiteral(typeAnnotation)) {
        typeDeclaration = t.tsInterfaceDeclaration(
          typeIdentifier,
          null,
          null,
          t.tsInterfaceBody(typeAnnotation.members)
        );
      }

      const leadingComments = pathWhereToDeclareType.node.leadingComments || [];
      const start =
        leadingComments[0]?.loc.start || pathWhereToDeclareType.node.loc.start;
      newNodePosition = Position.fromAST(start);
      pathWhereToDeclareType.insertBefore(typeDeclaration);
      path.node.typeAnnotation = getNewTypeAnnotation(typeIdentifier);
    })
  );

  return { ...result, newNodePosition };
}

function createVisitor(
  selection: Selection,
  onMatch: (
    path: t.NodePath<t.TSTypeAnnotation>,
    extractedTypeAnnotation: t.TSType,
    getNewTypeAnnotation: (identifier: t.Identifier) => t.TSType
  ) => void
): t.Visitor {
  return {
    TSTypeAnnotation(path) {
      if (!selection.isInsidePath(path)) return;

      const { typeAnnotation } = path.node;

      if (t.isTSUnionType(typeAnnotation)) {
        const selectedType = typeAnnotation.types.find((type) =>
          selection.isInsideNode(type)
        );

        if (selectedType) {
          const selectedTypeAnnotation = {
            ...typeAnnotation,
            types: [selectedType]
          };

          return onMatch(path, selectedTypeAnnotation, (identifier) => ({
            ...typeAnnotation,
            // Replace selected type with a generic type annotation
            // @ts-expect-error It seems genericTypeAnnotation was typed with Flow in mind, but it works with TS
            types: typeAnnotation.types.map((type) => {
              if (type === selectedType) {
                return t.genericTypeAnnotation(identifier);
              }
              return type;
            })
          }));
        }
      }

      onMatch(path, typeAnnotation, (identifier) =>
        // @ts-expect-error It seems genericTypeAnnotation was typed with Flow in mind, but it works with TS
        t.genericTypeAnnotation(identifier)
      );
    }
  };
}
