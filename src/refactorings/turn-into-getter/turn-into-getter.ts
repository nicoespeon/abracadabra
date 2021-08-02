import { Editor, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { turnIntoGetter, createVisitor };

async function turnIntoGetter(editor: Editor) {
  const { code, selection } = editor;
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindMethodToConvert);
    return;
  }

  await editor.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path) => {
      if (!t.isIdentifier(path.node.key)) return;

      const newName = getterName(path.node.key.name);

      path.parentPath.traverse({
        CallExpression(childPath) {
          const { callee } = childPath.node;

          if (!t.isMemberExpression(callee)) return;
          if (!t.isThisExpression(callee.object)) return;
          if (!t.areEquivalent(callee.property, path.node.key)) return;

          callee.property.name = newName;
          childPath.replaceWith(callee);
        }
      });

      path.node.kind = "get";
      path.node.key.name = newName;

      path.stop();
    })
  );
}

function getterName(methodName: string): string {
  if (!methodName.startsWith("get")) {
    return methodName;
  }

  const nameWithoutGet = methodName.slice(3);
  const [firstLetter, ...rest] = nameWithoutGet;
  return `${firstLetter.toLowerCase()}${rest.join("")}`;
}

function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<t.ClassMethod>) => void
): t.Visitor {
  return {
    ClassMethod(path) {
      if (!selection.isInsidePath(path)) return;
      if (path.node.params.length > 0) return;
      if (path.node.async) return;
      if (path.node.static) return;
      if (path.node.computed) return;
      if (path.node.kind !== "method") return;
      if (!t.hasFinalReturn(path.node.body.body)) return;

      onMatch(path);
    }
  };
}
