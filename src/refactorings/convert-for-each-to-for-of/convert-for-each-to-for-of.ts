import * as t from "../../ast";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Editor, ErrorReason } from "../../editor/editor";
import { Position } from "../../editor/position";
import { Selection } from "../../editor/selection";

export async function convertForEachToForOf(editor: Editor) {
  const { code, selection } = editor;
  const { transformed: updatedCode, forEachStartLine } = updateCode(
    t.parse(code),
    selection
  );

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindForEachToConvertToForOf);
    return;
  }

  // Recast would add an empty line before the transformed node.
  // If that's the case, get rid of it before we write the new code.
  const inMemoryEditor = new InMemoryEditor(updatedCode.code);
  if (inMemoryEditor.isLineBlank(forEachStartLine)) {
    inMemoryEditor.removeLine(forEachStartLine);
  }

  await editor.write(inMemoryEditor.code);
}

function updateCode(
  ast: t.AST,
  selection: Selection
): { transformed: t.Transformed; forEachStartLine: number } {
  let forEachStartLine = selection.start.line;
  const transformed = t.transformAST(
    ast,
    createVisitor(selection, (path, { item, items, fn, fnPath }) => {
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

      if (path.parentPath.node.loc) {
        forEachStartLine = Position.fromAST(
          path.parentPath.node.loc.start
        ).line;
      }
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
  return { transformed, forEachStartLine };
}

export function createVisitor(
  selection: Selection,
  onMatch: (
    path: t.SelectablePath<t.CallExpression>,
    args: {
      item: t.Identifier | t.Pattern;
      items: t.Expression;
      fnPath: t.NodePath<t.FunctionExpression | t.ArrowFunctionExpression>;
      fn: t.FunctionExpression | t.ArrowFunctionExpression;
    }
  ) => void
): t.Visitor {
  // Traverse children first using `exit` and stop matching if we've already found a match.
  let found = false;
  return {
    CallExpression: {
      exit(path) {
        if (found) return;

        if (!selection.isInsidePath(path)) return;

        if (!t.isExpressionStatement(path.parent)) return;
        if (!t.isMemberExpression(path.node.callee)) return;
        if (!t.isIdentifier(path.node.callee.property, { name: "forEach" }))
          return;

        // forEach should only have one argument, an arrow function (or a regular function)
        if (path.node.arguments.length !== 1) return;
        const fnPath = path.get("arguments")[0];
        if (
          !fnPath.isArrowFunctionExpression() &&
          !fnPath.isFunctionExpression()
        )
          return;
        const fn = fnPath.node;

        // for-of cannot give you the index, so ignore callbacks with more than one param
        if (fn.params.length !== 1) return;
        const item = fn.params[0];
        if (!t.isIdentifier(item) && !t.isPattern(item)) return;

        const items = path.node.callee.object;

        onMatch(path, { item, items, fn, fnPath });

        found = true;
      }
    }
  };
}
