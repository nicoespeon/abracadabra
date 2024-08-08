import { match, P } from "ts-pattern";
import { Editor, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export async function simplifyBoolean(editor: Editor) {
  const { code, selection } = editor;
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindBooleanToSimplify);
    return;
  }

  await editor.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path, newExpression) => {
      path.replaceWith(newExpression);
      path.stop();
    })
  );
}

export function createVisitor(
  selection: Selection,
  onMatch: (
    path: t.NodePath<t.LogicalExpression>,
    newExpression: t.Expression
  ) => void
): t.Visitor {
  return {
    LogicalExpression(path) {
      if (!selection.isInsidePath(path)) return;

      match([path.node.left, path.node.operator, path.node.right])
        .with(
          [whenNodeIs(true), "||", P.any],
          [whenNodeIs(false), "&&", P.any],
          [P.any, "||", whenNodeIs(false)],
          [P.any, "&&", whenNodeIs(true)],
          () => onMatch(path, path.node.left)
        )
        .with(
          [whenNodeIs(false), "||", P.any],
          [whenNodeIs(true), "&&", P.any],
          [P.any, "||", whenNodeIs(true)],
          [P.any, "&&", whenNodeIs(false)],
          () => onMatch(path, path.node.right)
        )
        .otherwise(() => {});
    }
  };
}

function whenNodeIs(value: boolean) {
  return P.when((node: t.Expression): node is t.BooleanLiteral => {
    const isBooleanLiteral = t.isBooleanLiteral(node) && node.value === value;

    const isNegatedBooleanLiteral =
      t.isUnaryExpression(node) &&
      node.operator === "!" &&
      t.isBooleanLiteral(node.argument) &&
      node.argument.value === !value;

    return isBooleanLiteral || isNegatedBooleanLiteral;
  });
}
