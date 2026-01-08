import * as t from "../../ast";
import { Selection } from "../../editor/selection";
import { COMMANDS, EditorCommand, RefactoringState } from "../../refactorings";

export function splitDeclarationAndInitialization(
  state: RefactoringState
): EditorCommand {
  if (state.state !== "new") return COMMANDS.doNothing();

  const { code, selection } = state;
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    return COMMANDS.showErrorDidNotFind("declaration to split");
  }

  return COMMANDS.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path: t.NodePath<t.VariableDeclaration>) => {
      const declarations = path.node.declarations;
      const kind = path.node.kind === "const" ? "let" : path.node.kind;
      t.replaceWithMultiplePreservingComments(path, [
        t.variableDeclaration(
          kind,
          declarations.flatMap(({ id }) => createVariableDeclarators(id))
        ),
        ...declarations
          .filter(isDeclarationInitialized)
          .filter(
            (d): d is VariableDeclaratorWithLValAndExpression =>
              t.isLVal(d.id) && t.isExpression(d.init)
          )
          .map(({ id, init }) => {
            if (t.isIdentifier(id) && id.typeAnnotation) {
              // Create identifier without type annotation
              id = t.identifier(id.name);
            }

            return t.expressionStatement(t.assignmentExpression("=", id, init));
          })
      ]);
    })
  );
}

type VariableDeclaratorWithLValAndExpression = t.VariableDeclarator & {
  id: t.LVal;
  init: t.Expression;
};

function createVariableDeclarators(
  leftValue: t.LVal | t.VoidPattern
): t.VariableDeclarator[] {
  const identifiers = t.isObjectPattern(leftValue)
    ? objectPatternLVals(leftValue)
    : [leftValue];

  return identifiers.map((id) => t.variableDeclarator(id));
}

function objectPatternLVals(objectPattern: t.ObjectPattern): t.LVal[] {
  return objectPattern.properties
    .map((property) => {
      return t.isRestElement(property) ? property.argument : property.key;
    })
    .filter((lval) => t.isLVal(lval));
}

export function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<t.VariableDeclaration>) => void
): t.Visitor {
  return {
    VariableDeclaration(path) {
      if (!selection.isInsidePath(path)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      const declarations = path.node.declarations;
      if (!hasInitializedDeclaration(declarations)) return;

      onMatch(path);
    }
  };
}

function hasChildWhichMatchesSelection(
  path: t.NodePath,
  selection: Selection
): boolean {
  let result = false;

  path.traverse({
    VariableDeclaration(childPath) {
      if (!selection.isInsidePath(childPath)) return;

      result = true;
      childPath.stop();
    }
  });

  return result;
}

function hasInitializedDeclaration(
  declarations: t.VariableDeclarator[]
): boolean {
  return declarations.some(isDeclarationInitialized);
}

function isDeclarationInitialized(
  declaration: t.VariableDeclarator
): declaration is t.VariableDeclarator & { init: t.Expression } {
  return declaration.init !== null;
}
