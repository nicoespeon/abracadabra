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

      const existingNames = new Set<string>();
      path.parentPath.traverse({
        ClassMethod(childPath) {
          if (t.isIdentifier(childPath.node.key)) {
            existingNames.add(childPath.node.key.name);
          }
        },
        ClassProperty(childPath) {
          if (t.isIdentifier(childPath.node.key)) {
            existingNames.add(childPath.node.key.name);
          }
        }
      });
      const newName = getterName(path.node.key.name, existingNames);

      // TODO: find instances of class
      if (path.parentPath.parentPath.isClassDeclaration()) {
        const allBindings = Object.values(
          path.parentPath.parentPath.scope.getAllBindings()
        );

        // Find all new instances Identifiers
        let allIds: t.NodePath<t.Identifier>[] = [];
        if (
          allBindings[0].referencePaths[0].parentPath.isNewExpression() &&
          allBindings[0].referencePaths[0].parentPath.parentPath.isVariableDeclarator()
        ) {
          allIds.push(
            allBindings[0].referencePaths[0].parentPath.parentPath.get("id")
          );
        }

        // Find all references to these Identifiers that uses the method
        if (
          allBindings[1].referencePaths[0].parentPath.isMemberExpression() &&
          t.areEquivalent(
            allBindings[1].referencePaths[0].parentPath.node.object,
            allIds[0].node
          )
        ) {
          if (
            t.areEquivalent(
              allBindings[1].referencePaths[0].parentPath.node.property,
              path.node.key
            )
          ) {
            allBindings[1].referencePaths[0].parentPath.node.property.name =
              newName;
            allBindings[1].referencePaths[0].parentPath.parentPath.replaceWith(
              allBindings[1].referencePaths[0].parentPath.node
            );
          }
        }
      }

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

function getterName(methodName: string, existingNames: Set<string>): string {
  if (!methodName.startsWith("get")) {
    return methodName;
  }

  const nameWithoutGet = methodName.slice(3);
  const [firstLetter, ...rest] = nameWithoutGet;
  const result = `${firstLetter.toLowerCase()}${rest.join("")}`;
  if (existingNames.has(result)) {
    return methodName;
  }

  return result;
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
      if (!t.allPathsReturn(path.node.body)) return;

      onMatch(path);
    }
  };
}
