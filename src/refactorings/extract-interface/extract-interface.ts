import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Position } from "../../editor/position";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";
import { renameSymbol } from "../rename-symbol/rename-symbol";

export { extractInterface, canExtractInterfaceVisitorFactory };

async function extractInterface(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFoundClassToExtractInterface);
    return;
  }

  await editor.write(updatedCode.code);

  await editor.moveCursorTo(updatedCode.interfaceIdentifierPosition);

  await renameSymbol(editor);
}

function canExtractInterfaceVisitorFactory(
  selection: Selection,
  onMatch: (path: t.NodePath<any>) => void
): t.Visitor {
  return createVisitor(selection, onMatch);
}

function updateCode(
  ast: t.AST,
  selection: Selection
): t.Transformed & { interfaceIdentifierPosition: Position } {
  let interfaceIdentifierPosition: Position = selection.start;

  const result = t.transformAST(
    ast,
    createVisitor(selection, (path, id, declaration) => {
      if (t.isSelectableNode(path.node)) {
        // "interface X" => 10 characters before "X"
        const interfaceIdentifierOffset = 10;

        interfaceIdentifierPosition = Position.fromAST(path.node.loc.end)
          .putAtStartOfLine()
          // New interface starts 2 lines after class declaration
          .putAtNextLine()
          .putAtNextLine()
          .addCharacters(interfaceIdentifierOffset);
      }

      path.node.implements = [t.classImplements(id)];
      path.insertAfter(declaration);
    })
  );

  return { ...result, interfaceIdentifierPosition };
}

function createVisitor(
  selection: Selection,
  onMatch: (
    path: t.NodePath<t.ClassDeclaration>,
    id: t.Identifier,
    declaration: t.TSInterfaceDeclaration
  ) => void
): t.Visitor {
  return {
    ClassDeclaration(path) {
      if (!selection.isInsidePath(path)) return;

      const methods = path.node.body.body.filter(
        (method): method is t.ClassMethod => t.isClassMethod(method)
      );

      const declarations = methods
        .filter(isPublic)
        .filter(method => !isConstructor(method))
        .map(method => {
          return t.tsMethodSignature(
            method.key,
            null,
            method.params.filter(
              (param): param is t.Identifier => t.isIdentifier(param)
            ),
            t.isTSTypeAnnotation(method.returnType) ? method.returnType : null
          );
        });

      let autoAssignedProperties: t.TSPropertySignature[] = [];
      const constructorDeclaration = methods.find(isConstructor);
      if (constructorDeclaration) {
        autoAssignedProperties = constructorDeclaration.params
          .filter(
            (param): param is t.TSParameterProperty =>
              t.isTSParameterProperty(param)
          )
          .filter(isPublic)
          .reduce<t.TSPropertySignature[]>((memo, property) => {
            let result;

            if (t.isIdentifier(property.parameter)) {
              result = t.tsPropertySignature(property.parameter);
            } else {
              const key = property.parameter.left;
              if (!t.isExpression(key)) return memo;

              result = t.tsPropertySignature(
                key,
                t.isTSTypeAnnotation(key.typeAnnotation)
                  ? null
                  : toTSType(property.parameter.right)
              );
            }

            // Mutates the result because of a weird bug: TS complains "Too many arguments"
            // if we pass more than 3 params even though `tsPropertySignature` takes 6 params.
            result.readonly = property.readonly;
            return memo.concat(result);
          }, []);
      }

      const classProperties = path.node.body.body
        .filter(
          (property): property is t.ClassProperty => t.isClassProperty(property)
        )
        .filter(isPublic)
        .map(property => {
          const result = t.tsPropertySignature(
            property.key,
            t.isTSTypeAnnotation(property.typeAnnotation)
              ? property.typeAnnotation
              : toTSType(property.value)
          );

          // Mutates the result because of a weird bug: TS complains "Too many arguments"
          // if we pass more than 3 params even though `tsPropertySignature` takes 6 params.
          result.readonly = property.readonly;
          return result;
        });

      const interfaceIdentifier = t.identifier("Extracted");
      const interfaceDeclaration = t.tsInterfaceDeclaration(
        interfaceIdentifier,
        undefined,
        undefined,
        t.tsInterfaceBody([
          ...classProperties,
          ...autoAssignedProperties,
          ...declarations
        ])
      );

      onMatch(path, interfaceIdentifier, interfaceDeclaration);
    }
  };
}

function isPublic(
  node: t.TSParameterProperty | t.ClassProperty | t.ClassMethod
): boolean {
  return node.accessibility === "public" || !node.accessibility;
}

function isConstructor(method: t.ClassMethod): boolean {
  return method.kind === "constructor";
}

function toTSType(value: t.ClassProperty["value"]): t.TSTypeAnnotation | null {
  if (t.isNumericLiteral(value)) {
    return t.tsTypeAnnotation(t.tsNumberKeyword());
  }

  if (t.isStringLiteral(value)) {
    return t.tsTypeAnnotation(t.tsStringKeyword());
  }

  if (t.isBooleanLiteral(value)) {
    return t.tsTypeAnnotation(t.tsBooleanKeyword());
  }

  return t.tsTypeAnnotation(t.tsAnyKeyword());
}
