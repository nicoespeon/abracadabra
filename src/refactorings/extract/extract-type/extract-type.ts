import * as t from "../../../ast";
import { Command, Editor, ErrorReason } from "../../../editor/editor";
import { Position } from "../../../editor/position";
import { Selection } from "../../../editor/selection";

export async function extractType(editor: Editor) {
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
    createVisitor(selection, (path, typeAnnotation, replaceTypeWith) => {
      const pathWhereToDeclareType =
        t.findAncestorThatCanHaveVariableDeclaration(path);
      if (!pathWhereToDeclareType) return;
      if (!pathWhereToDeclareType.parentPath) return;

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
        leadingComments[0]?.loc?.start || pathWhereToDeclareType.node.loc.start;
      newNodePosition = Position.fromAST(start);
      pathWhereToDeclareType.insertBefore(typeDeclaration);
      replaceTypeWith(typeIdentifier);
      pathWhereToDeclareType.stop();
    })
  );

  // There may be commas in inlined object types.
  // They got preserved because of tokens, but that produces invalid code.
  // Get rid of the eventual errors: `foo: number,;` => `foo: number;`
  if (result.hasCodeChanged) {
    result.code = result.code.replace(/,;/g, ";");
  }

  return { ...result, newNodePosition };
}

function createVisitor(
  selection: Selection,
  onMatch: (
    path: t.NodePath<
      | t.TSTypeAnnotation
      | t.TSAsExpression
      | t.TSBaseType
      | t.TSTypeReference
      | t.TSTypeQuery
      | t.TSUnionType
      | t.TSIntersectionType
    >,
    extractedTypeAnnotation: t.TSType,
    replaceType: (identifier: t.Identifier) => void
  ) => void
): t.Visitor {
  return {
    TSBaseType(path) {
      if (!selection.isInsidePath(path)) return;
      if (!t.isTSTypeParameterInstantiation(path.parent)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      onMatch(path, path.node, (identifier) => {
        path.replaceWith(t.genericTypeAnnotation(identifier));
      });
    },

    TSTypeQuery(path) {
      if (!selection.isInsidePath(path)) return;

      onMatch(path, path.node, (identifier) => {
        path.replaceWith(t.genericTypeAnnotation(identifier));
      });
    },

    TSUnionType(path) {
      if (!selection.isInsidePath(path)) return;
      // This case is already handled in TSTypeAnnotation
      if (path.parentPath.isTSTypeAnnotation()) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      onMatch(path, path.node, (identifier) => {
        path.replaceWith(t.genericTypeAnnotation(identifier));
      });
    },

    TSIntersectionType(path) {
      if (!selection.isInsidePath(path)) return;
      // This case is already handled in TSTypeAnnotation
      if (path.parentPath.isTSTypeAnnotation()) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      onMatch(path, path.node, (identifier) => {
        path.replaceWith(t.genericTypeAnnotation(identifier));
      });
    },

    TSTypeReference(path) {
      if (!selection.isInsidePath(path)) return;
      if (!t.isTSTypeParameterInstantiation(path.parent)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      onMatch(path, path.node, (identifier) => {
        path.replaceWith(t.genericTypeAnnotation(identifier));
      });
    },

    TSAsExpression(path) {
      if (!selection.isInsidePath(path)) return;
      if (selection.isInsideNode(path.node.expression)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      onMatch(path, path.node.typeAnnotation, (identifier) => {
        // @ts-expect-error It seems genericTypeAnnotation was typed with Flow in mind, but it works with TS
        path.node.typeAnnotation = t.genericTypeAnnotation(identifier);
      });
    },

    TSTypeAnnotation(path) {
      if (!selection.isInsidePath(path)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      const { typeAnnotation } = path.node;

      if (
        t.isTSUnionType(typeAnnotation) ||
        t.isTSIntersectionType(typeAnnotation)
      ) {
        const selectedType = typeAnnotation.types.find((type) =>
          selection.isInsideNode(type)
        );

        if (selectedType) {
          const selectedTypeAnnotation = {
            ...typeAnnotation,
            types: [selectedType]
          };

          return onMatch(path, selectedTypeAnnotation, (identifier) => {
            path.node.typeAnnotation = {
              ...typeAnnotation,
              // Replace selected type with a generic type annotation
              // @ts-expect-error It seems genericTypeAnnotation was typed with Flow in mind, but it works with TS
              types: typeAnnotation.types.map((type) => {
                if (type === selectedType) {
                  return t.genericTypeAnnotation(identifier);
                }
                return type;
              })
            };
          });
        }
      }

      onMatch(path, typeAnnotation, (identifier) => {
        // @ts-expect-error It seems genericTypeAnnotation was typed with Flow in mind, but it works with TS
        path.node.typeAnnotation = t.genericTypeAnnotation(identifier);
      });
    }
  };
}

function hasChildWhichMatchesSelection(
  path: t.NodePath,
  selection: Selection
): boolean {
  let result = false;

  path.traverse({
    TSTypeAnnotation(childPath) {
      if (!selection.isInsidePath(childPath)) return;

      result = true;
      childPath.stop();
    },
    TSBaseType(childPath) {
      if (!selection.isInsidePath(childPath)) return;
      if (!t.isTSTypeParameterInstantiation(childPath.parent)) return;

      result = true;
      childPath.stop();
    }
  });

  return result;
}
