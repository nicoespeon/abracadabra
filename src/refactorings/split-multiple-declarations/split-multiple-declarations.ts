import { Code } from "../../editor/editor";
import { didNotFind } from "../../editor/error-reason";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";
import { OperationResult } from "../../types";

export function splitMultipleDeclarations(
  code: Code,
  selection: Selection
): OperationResult {
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    return {
      action: "show error",
      reason: didNotFind("multiple variable declarations to split")
    };
  }

  return { action: "write", code: updatedCode.code };
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path: t.NodePath<t.VariableDeclaration>) => {
      const declarators = path.node.declarations;
      const kind = path.node.kind;

      const declarations = declarators.map(function (declarator) {
        return t.variableDeclaration(kind, [declarator]);
      });

      t.replaceWithMultiplePreservingComments(path, declarations);
    })
  );
}

export function createVisitor(
  _selection: Selection,
  onMatch: (path: t.NodePath<t.VariableDeclaration>) => void
): t.Visitor {
  return {
    VariableDeclaration(path) {
      const declarations = path.node.declarations;
      if (!hasInitializedMultipleDeclarations(declarations)) return;

      onMatch(path);
    }
  };
}

function hasInitializedMultipleDeclarations(
  declarations: t.VariableDeclarator[]
): boolean {
  return declarations.length >= 2;
}
