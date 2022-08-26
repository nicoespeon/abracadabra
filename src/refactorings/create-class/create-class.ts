import { Editor, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";
import { NewExpression } from "../../ast";

export async function createClass(editor: Editor) {
  const { code, selection } = editor;
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.CantCreateClass);
    return;
  }

  await editor.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path) => {
      const node = path.node;
      const callee = node.callee;
      if (t.isIdentifier(callee)) {
        const classBody: t.ClassMethod[] = [];

        if (node.arguments.length > 0) {
          classBody.push(
            t.classMethod(
              "constructor",
              t.identifier("constructor"),
              createParametersFrom(node.arguments),
              t.blockStatement([])
            )
          );
        }

        const classDeclaration = t.classDeclaration(
          t.identifier(callee.name),
          null,
          t.classBody(classBody)
        );

        path.parentPath.insertBefore(classDeclaration);
      }

      path.stop();
    })
  );
}

export function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<NewExpression>) => void
): t.Visitor {
  return {
    NewExpression(path) {
      if (!selection.isInsidePath(path)) return;

      if (classDefinitionExist(path)) return;

      onMatch(path);
    }
  };
}

function classDefinitionExist(path: t.NodePath<NewExpression>) {
  const node = path.node;

  if (t.isIdentifier(node.callee) && path.scope.bindings[node.callee.name]) {
    return true;
  }

  return false;
}
function createParametersFrom(
  fnArguments: (
    | t.ArgumentPlaceholder
    | t.JSXNamespacedName
    | t.SpreadElement
    | t.Expression
  )[]
): (t.Identifier | t.RestElement | t.TSParameterProperty | t.Pattern)[] {
  return fnArguments.map((arg, index) => {
    const identifier = t.identifier(getNameOfArg(arg, index + 1));

    return identifier;
  });
}

function getNameOfArg(arg: any, index: number) {
  switch (arg.type) {
    case "StringLiteral":
      return addCountToStr(arg.value.toLowerCase(), index);
    case "BooleanLiteral":
      return addCountToStr("b", index);
    case "NumericLiteral":
      return addCountToStr("number", index);
    case "CallExpression":
    case "NewExpression":
      return addCountToStr(arg.callee.name, index);
    case "NullLiteral":
    case "ArrowFunctionExpression":
      return addCountToStr("param", index);
    case "Identifier":
      return addCountToStr(arg.name, index);
    default:
      return "param";
  }
}

function addCountToStr(str: string, count: number) {
  return `${str}${count === 1 ? "" : count}`;
}
