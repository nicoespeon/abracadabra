import * as t from "../../ast";
import { Selection } from "../../editor/selection";
import { COMMANDS, EditorCommand, RefactoringState } from "../../refactorings";

type IsFunction = t.NodePath<
  | t.FunctionDeclaration
  | t.FunctionExpression
  | t.ArrowFunctionExpression
  | t.ObjectMethod
  | t.ClassMethod
  | t.ClassPrivateMethod
>;

export function extractParameter(state: RefactoringState): EditorCommand {
  const updatedCode = updateCode(t.parse(state.code), state.selection);

  if (!updatedCode.hasCodeChanged) {
    return COMMANDS.showErrorDidNotFind("a parameter to extract");
  }

  return COMMANDS.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(
      selection,
      (path, functionPath, assignmentId, assignmentInit) => {
        const assignmentPattern = t.assignmentPattern(
          assignmentId,
          assignmentInit
        );
        functionPath.node.params.push(assignmentPattern);
        path.remove();
        path.stop();
      }
    )
  );
}

export function createVisitor(
  selection: Selection,
  onMatch: (
    path: t.NodePath<t.VariableDeclarator>,
    functionPath: IsFunction,
    assignmentId: Parameters<typeof t.assignmentPattern>[0],
    assignmentInit: t.Expression
  ) => void
): t.Visitor {
  return {
    VariableDeclarator: (path) => {
      if (!selection.isInsidePath(path)) return;

      const functionPath = path.parentPath.parentPath?.parentPath;
      if (!isFunction(functionPath)) {
        return;
      }

      // Make type explicit, otherwise TS struggles to narrow the `id` type.
      const variableDeclarator: t.VariableDeclarator = path.node;
      if (
        t.isRestElement(variableDeclarator.id) ||
        t.isAssignmentPattern(variableDeclarator.id) ||
        t.isTSParameterProperty(variableDeclarator.id)
      ) {
        return;
      }
      if (!variableDeclarator.init) {
        return;
      }

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      onMatch(
        path,
        functionPath,
        variableDeclarator.id,
        variableDeclarator.init
      );
    }
  };
}

function hasChildWhichMatchesSelection(
  path: t.NodePath,
  selection: Selection
): boolean {
  let result = false;

  path.traverse({
    VariableDeclarator(childPath) {
      if (!selection.isInsidePath(childPath)) return;

      const functionPath = childPath.parentPath.parentPath?.parentPath;
      if (!isFunction(functionPath)) {
        return;
      }

      // Make type explicit, otherwise TS struggles to narrow the `id` type.
      const variableDeclarator: t.VariableDeclarator = childPath.node;
      if (
        t.isRestElement(variableDeclarator.id) ||
        t.isAssignmentPattern(variableDeclarator.id) ||
        t.isTSParameterProperty(variableDeclarator.id)
      ) {
        return;
      }
      if (!variableDeclarator.init) {
        return;
      }

      result = true;
      childPath.stop();
    }
  });

  return result;
}

function isFunction(
  functionPath: t.NodePath<unknown> | null | undefined
): functionPath is IsFunction {
  return (
    !!functionPath &&
    (functionPath.isFunctionDeclaration() ||
      functionPath.isFunctionExpression() ||
      functionPath.isArrowFunctionExpression() ||
      functionPath.isObjectMethod() ||
      functionPath.isClassMethod() ||
      functionPath.isClassPrivateMethod())
  );
}
