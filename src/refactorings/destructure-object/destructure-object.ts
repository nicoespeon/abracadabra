import { Code, Editor, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { TypeChecker, ConsoleLogger } from "../../type-checker";
import * as t from "../../ast";

export { destructureObject, createVisitor };

async function destructureObject(editor: Editor) {
  const { code, selection } = editor;
  const updatedCode = updateCode(code, selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindObjectToDestructure);
    return;
  }

  await editor.write(updatedCode.code);
}

function updateCode(code: Code, selection: Selection): t.Transformed {
  return t.transformAST(
    t.parse(code),
    createVisitor(
      selection,
      (path, keys) => {
        // Replace references of the Identifier
        const referencePaths =
          path.scope.getBinding(path.node.name)?.referencePaths ?? [];
        const properties: t.ObjectProperty[] = keys.map((key) =>
          t.objectProperty(t.identifier(key), t.identifier(key), false, true)
        );

        referencePaths.forEach((reference) => {
          const { parentPath } = reference;

          if (parentPath?.isMemberExpression()) {
            parentPath.replaceWith(parentPath.node.property);
          }

          // Replace JSX spread attribute with individual attributes
          if (parentPath?.isJSXSpreadAttribute()) {
            const attributes: t.JSXAttribute[] = keys.map((key) => {
              return t.jsxAttribute(
                t.jsxIdentifier(key),
                t.jsxExpressionContainer(t.identifier(key))
              );
            });
            parentPath.replaceWithMultiple(attributes);
          }

          // Replace spread element with destructured object
          if (parentPath?.isSpreadElement()) {
            parentPath.replaceWithMultiple(properties);
          }
        });

        // Replace Identifier with destructured object
        const node = t.objectPattern(properties);
        node.typeAnnotation = path.node.typeAnnotation;
        path.replaceWith(node);

        path.stop();
      },
      new TypeChecker(code, new ConsoleLogger())
    )
  );
}

function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<t.Identifier>, keys: string[]) => void,
  typeChecker: TypeChecker
): t.Visitor {
  const keys = typeChecker.getKeys(selection.start);

  return {
    Identifier(path) {
      if (!selection.isInsidePath(path)) return;
      if (keys.length === 0) return;

      const sourcePath = path.scope.getBinding(path.node.name)?.path;

      const sourcePathId = sourcePath?.get("id");
      if (!Array.isArray(sourcePathId) && sourcePathId?.isIdentifier()) {
        onMatch(sourcePathId, keys);
      } else if (sourcePath?.isIdentifier()) {
        onMatch(sourcePath, keys);
      } else {
        onMatch(path, keys);
      }
    }
  };
}
