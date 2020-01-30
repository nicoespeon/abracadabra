import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { extractInterface, canExtractInterface };

// TODO: Generics (typeParameters)

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
}

function canExtractInterface(/* ast: t.AST, selection: Selection */): boolean {
  // TODO: implement the check here 🧙‍
  return false;
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(ast, {
    ClassDeclaration(path) {
      if (!selection.isInsidePath(path)) return;

      const methods = path.node.body.body.filter(
        (method): method is t.ClassMethod => t.isClassMethod(method)
      );

      const declarations = methods
        .filter(method => isPublic(method))
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
          .map(param => param.parameter)
          .filter(
            (property): property is t.Identifier => t.isIdentifier(property)
          )
          .map(property => t.tsPropertySignature(property));
      }

      const properties = path.node.body.body
        .filter(
          (property): property is t.ClassProperty => t.isClassProperty(property)
        )
        .filter(property => isPublic(property))
        .map(property => {
          // Only pass 3 params and mutates the result because of a weird bug.
          // TS complains "Too many arguments" if we pass more than 3 params
          // even though `tsPropertySignature` takes 6 params.
          const result = t.tsPropertySignature(
            property.key,
            t.isTSTypeAnnotation(property.typeAnnotation)
              ? property.typeAnnotation
              : toTSType(property.value),
            null
          );
          result.readonly = property.readonly;
          return result;
        })
        .concat(autoAssignedProperties);

      const interfaceIdentifier = t.identifier("Extracted");
      const interfaceDeclaration = t.tsInterfaceDeclaration(
        interfaceIdentifier,
        undefined,
        undefined,
        t.tsInterfaceBody([...properties, ...declarations])
      );

      path.node.implements = [t.classImplements(interfaceIdentifier)];
      path.insertAfter(interfaceDeclaration);
    }
  });
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
