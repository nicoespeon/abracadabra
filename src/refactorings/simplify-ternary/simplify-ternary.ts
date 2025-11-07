import * as t from "../../ast";
import { Selection } from "../../editor/selection";
import { COMMANDS, EditorCommand, RefactoringState } from "../../refactorings";

export function simplifyTernary(state: RefactoringState): EditorCommand {
  const { code, selection } = state;
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    return COMMANDS.showErrorDidNotFind("ternary to simplify");
  }

  return COMMANDS.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path, convertedNode) => {
      path.replaceWith(convertedNode);
      path.stop();
    })
  );
}

export function createVisitor(
  selection: Selection,
  onMatch: (
    path: t.NodePath<t.ConditionalExpression>,
    convertedNode: t.Node
  ) => void
): t.Visitor {
  return {
    ConditionalExpression(path) {
      if (!selection.isInsidePath(path)) return;

      if (t.isBooleanLiteral(path.node.test)) {
        // bool ? a : b
        if (path.node.test.value) {
          onMatch(path, path.node.consequent);
        } else {
          onMatch(path, path.node.alternate);
        }
      } else if (
        t.isBooleanLiteral(path.node.consequent) &&
        t.isBooleanLiteral(path.node.alternate)
      ) {
        // a ? bool : bool
        const consequentValue = path.node.consequent.value;
        const alternateValue = path.node.alternate.value;

        if (consequentValue) {
          if (alternateValue) {
            // a ? true : true
            onMatch(path, t.booleanLiteral(true));
          } else {
            // a ? true : false
            onMatch(
              path,
              t.callExpression(t.identifier("Boolean"), [path.node.test])
            );
          }
        } else {
          if (alternateValue) {
            // a ? false : true
            onMatch(path, t.unaryExpression("!", path.node.test));
          } else {
            onMatch(path, t.booleanLiteral(false));
          }
        }
      } else if (t.areEquivalent(path.node.test, path.node.consequent)) {
        // a ? a : b
        onMatch(
          path,
          t.logicalExpression("||", path.node.test, path.node.alternate)
        );
      }
    }
  };
}
