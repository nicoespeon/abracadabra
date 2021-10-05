import * as t from "../../ast";
import { Editor, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";

export { convertForEachToForOf, createVisitor };

async function convertForEachToForOf(editor: Editor) {
  const { code, selection } = editor;
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindForEachToConvertToForOf);
    return;
  }

  await editor.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, ({ path, item, items, fn, fnPath }) => {
      fnPath.traverse({
        ReturnStatement(returnPath) {
          const parentFunction = returnPath.findParent(
            (path) =>
              path === fnPath ||
              path.isFunctionExpression() ||
              path.isArrowFunctionExpression() ||
              path.isFunctionDeclaration()
          );
          if (parentFunction !== fnPath) return;
          returnPath.replaceWith(t.continueStatement());
        }
      });

      path.parentPath.replaceWith(
        t.forOfStatement(
          t.variableDeclaration("const", [t.variableDeclarator(item)]),
          items,
          t.isExpression(fn.body)
            ? t.blockStatement([t.expressionStatement(fn.body)])
            : fn.body
        )
      );
    })
  );
}

function createVisitor(
  selection: Selection,
  onMatch: (args: {
    path: t.SelectablePath<t.CallExpression>;
    item: t.Identifier | t.Pattern;
    items: t.Expression;
    fnPath: t.NodePath<t.FunctionExpression | t.ArrowFunctionExpression>;
    fn: t.FunctionExpression | t.ArrowFunctionExpression;
  }) => void
): t.Visitor {
  return {
    CallExpression(path) {
      if (!selection.isInsidePath(path)) return;

      if (!t.isExpressionStatement(path.parent)) return;
      if (!t.isMemberExpression(path.node.callee)) return;
      if (!t.isIdentifier(path.node.callee.property, { name: "forEach" }))
        return;

      // forEach should only have one argument, an arrow function (or a regular function)
      if (path.node.arguments.length !== 1) return;
      const fnPath = path.get("arguments")[0];
      if (!fnPath.isArrowFunctionExpression() && !fnPath.isFunctionExpression())
        return;
      const fn = fnPath.node;

      // for-of cannot give you the index, so ignore callbacks with more than one param
      if (fn.params.length !== 1) return;
      const item = fn.params[0];
      if (!t.isIdentifier(item) && !t.isPattern(item)) return;

      const items = path.node.callee.object;

      onMatch({ path, item, items, fn, fnPath });
    }
  };
}
