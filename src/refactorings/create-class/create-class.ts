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

        const isExported = t.isExportDeclaration(path.parent);
        if (isExported) {
          path.insertBefore(t.exportNamedDeclaration(classDeclaration));
        } else {
          path.insertBefore(classDeclaration);
        }
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
  const countKind: Record<string, number> = {};
  const types: Record<string, string> = {
    StringLiteral: "str",
    NumericLiteral: "num",
    BooleanLiteral: "bool",
    RegexLiteral: "regex",
    ObjectExpression: "obj",
    ObjectMethod: "fn",
    ObjectProperty: "val",
    ArrowFunctionExpression: "fn"
  };
  return fnArguments.map((arg) => {
    countKind[arg.type] = countKind[arg.type] || 0;
    countKind[arg.type] += 1;

    return t.identifier(`${types[arg.type]}${countKind[arg.type]}`);
  });
}
