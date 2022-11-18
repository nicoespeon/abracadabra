import * as t from "../../ast";
import { Editor, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";

export async function createFactoryForConstructor(editor: Editor) {
  const { code, selection } = editor;
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindClass);
    return;
  }

  await editor.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path) => {
      const constructor = getConstructor(path);
      if (!constructor) return;

      const functionParams = constructor.params.map((param) =>
        t.isTSParameterProperty(param) ? param.parameter : param
      );

      const instanceArguments = functionParams
        .map((param) =>
          t.isObjectPattern(param)
            ? toObjectExpression(param)
            : t.isArrayPattern(param)
            ? toArrayExpression(param)
            : t.isRestElement(param)
            ? toSpreadElement(param)
            : param
        )
        .filter(
          (
            param
          ): param is
            | t.Identifier
            | t.ArrayExpression
            | t.ObjectExpression
            | t.SpreadElement =>
            t.isIdentifier(param) ||
            t.isArrayExpression(param) ||
            t.isObjectExpression(param) ||
            t.isSpreadElement(param)
        )
        .map((param) => ({ ...param, typeAnnotation: null }));

      const functionDeclaration = t.functionDeclaration(
        t.identifier(`create${path.node.id.name}`),
        functionParams,
        t.blockStatement([
          t.returnStatement(t.newExpression(path.node.id, instanceArguments))
        ])
      );

      const isExported = t.isExportDeclaration(path.parent);
      if (isExported) {
        path.insertAfter(t.exportNamedDeclaration(functionDeclaration));
      } else {
        path.insertAfter(functionDeclaration);
      }

      path.stop();
    })
  );
}

function getConstructor(
  path: t.NodePath<t.ClassDeclaration>
): t.ClassMethod | undefined {
  return path.node.body.body.find(
    (method): method is t.ClassMethod =>
      t.isClassMethod(method) && method.kind === "constructor"
  );
}

function toObjectExpression(pattern: t.ObjectPattern): t.ObjectExpression {
  const properties = pattern.properties.map((property) => {
    return t.isRestElement(property) ? toSpreadElement(property) : property;
  });
  return t.objectExpression(properties);
}

function assignmentToObjectExpression(
  pattern: t.AssignmentPattern
): t.ObjectExpression {
  const key = t.isArrayPattern(pattern.left)
    ? toArrayExpression(pattern.left)
    : t.isObjectPattern(pattern.left)
    ? toObjectExpression(pattern.left)
    : pattern.left;

  return t.objectExpression([
    t.objectProperty(key, pattern.right, false, true)
  ]);
}

function toArrayExpression(pattern: t.ArrayPattern): t.ArrayExpression {
  const elements = pattern.elements.map((element) => {
    return t.isRestElement(element)
      ? toSpreadElement(element)
      : t.isArrayPattern(element)
      ? toArrayExpression(element)
      : t.isObjectPattern(element)
      ? toObjectExpression(element)
      : t.isAssignmentPattern(element)
      ? assignmentToObjectExpression(element)
      : t.isTSParameterProperty(element)
      ? null
      : element;
  });
  return t.arrayExpression(elements);
}

function toSpreadElement(rest: t.RestElement): t.SpreadElement {
  const argument = t.isArrayPattern(rest.argument)
    ? toArrayExpression(rest.argument)
    : t.isObjectPattern(rest.argument)
    ? toObjectExpression(rest.argument)
    : t.isTSParameterProperty(rest.argument)
    ? t.isAssignmentPattern(rest.argument.parameter)
      ? assignmentToObjectExpression(rest.argument.parameter)
      : rest.argument.parameter
    : t.isAssignmentPattern(rest.argument)
    ? assignmentToObjectExpression(rest.argument)
    : rest.argument;

  if (t.isRestElement(argument)) {
    // This is a nested element, it shouldn't be valid.
    // Types are probably wrong.
    throw new Error("Can't spread a rest element inside another rest element");
  }

  return t.spreadElement(argument);
}

export function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<t.ClassDeclaration>) => void
): t.Visitor {
  return {
    ClassDeclaration(path) {
      if (!selection.isInsidePath(path)) return;
      onMatch(path);
    }
  };
}
