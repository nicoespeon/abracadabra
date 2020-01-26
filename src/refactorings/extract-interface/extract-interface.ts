import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { extractInterface, canExtractInterface };

// TODO: properties through public constructor (auto-assign)
// TODO: properties computed
// TODO: properties optional
// TODO: properties readonly
// TODO: properties as const
// TODO: private properties
// TODO: method readonly
// TODO: constructor
// TODO: Generics (typeParameters)

// class Position implements Extracted {
//   x: number;
//   y = 10;
// }

// interface Extracted {
//   isEqualTo(position?: { x: number; y: number }): boolean;
// }

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

function canExtractInterface(ast: t.AST, selection: Selection): boolean {
  // TODO: implement the check here 🧙‍
  return false;
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(ast, {
    ClassDeclaration(path) {
      if (!selection.isInsidePath(path)) return;

      const declarations = path.node.body.body
        .filter((method): method is t.ClassMethod => t.isClassMethod(method))
        .filter(method => method.accessibility !== "private")
        .map(method => {
          return t.tsMethodSignature(
            method.key,
            null,
            // method.typeParameters,
            method.params.filter(
              (param): param is t.Identifier => t.isIdentifier(param)
            ),
            t.isTSTypeAnnotation(method.returnType) ? method.returnType : null
          );
        });

      const properties = path.node.body.body
        .filter(
          (property): property is t.ClassProperty => t.isClassProperty(property)
        )
        .map(property => {
          return t.tsPropertySignature(
            property.key,
            t.isTSTypeAnnotation(property.typeAnnotation)
              ? property.typeAnnotation
              : toTSType(property.value),
            null
          );
        });

      function toTSType(
        value: t.ClassProperty["value"]
      ): t.TSTypeAnnotation | null {
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
