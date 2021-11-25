import { Editor, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { createFactoryForConstructor, createVisitor };

async function createFactoryForConstructor(editor: Editor) {
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

      const params = constructor.params.filter((param): param is t.Identifier =>
        t.isIdentifier(param)
      );
      const functionDeclaration = t.functionDeclaration(
        t.identifier(`create${path.node.id.name}`),
        params,
        t.blockStatement([
          t.returnStatement(t.newExpression(path.node.id, params))
        ])
      );
      path.insertAfter(functionDeclaration);
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

function createVisitor(
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
