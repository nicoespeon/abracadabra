import * as t from "../../ast";
import { Editor, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";

export async function wrapInJsxFragment(editor: Editor) {
  const { code, selection } = editor;
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.CouldNotWrapInJsxFragment);
    return;
  }

  await editor.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path, node) => {
      t.replaceWithPreservingComments(path, node);
      path.stop();
    })
  );
}

export function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath, node: t.Node) => void
): t.Visitor {
  return {
    ReturnStatement(path) {
      if (!selection.isInsidePath(path)) return;

      const childPath = path.get("argument");
      if (childPath.isJSXElement()) {
        const fragment = t.jsxFragment(
          t.jsxOpeningFragment(),
          t.jsxClosingFragment(),
          [childPath.node]
        );
        childPath.node.extra?.parenthesized
          ? childPath.replaceWith(t.expressionStatement(fragment))
          : childPath.replaceWith(t.parenthesizedExpression(fragment));
        onMatch(childPath, childPath.node);
      } else {
        path.traverse({
          ReturnStatement: (nestedPath) => {
            const nestedChildPath = nestedPath.get("argument");
            if (!selection.isInsidePath(nestedPath)) return;
            if (nestedChildPath.isJSXElement()) {
              const fragment = t.jsxFragment(
                t.jsxOpeningFragment(),
                t.jsxClosingFragment(),
                [nestedChildPath.node]
              );
              nestedChildPath.node.extra?.parenthesized
                ? nestedChildPath.replaceWith(
                    t.jsxExpressionContainer(fragment)
                  )
                : nestedChildPath.replaceWith(
                    t.parenthesizedExpression(fragment)
                  );
              onMatch(nestedChildPath, nestedChildPath.node);
              nestedPath.stop();
            }
          }
        });
      }
    }
  };
}
