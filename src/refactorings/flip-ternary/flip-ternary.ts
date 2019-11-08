import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

import { getNegatedBinaryOperator } from "../negate-expression/negate-expression";

export { flipTernary, hasTernaryToFlip };

async function flipTernary(code: Code, selection: Selection, editor: Editor) {
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFoundTernaryToFlip);
    return;
  }

  await editor.write(updatedCode.code);
}

function hasTernaryToFlip(ast: t.AST, selection: Selection): boolean {
  return updateCode(ast, selection).hasCodeChanged;
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(ast, {
    ConditionalExpression(path) {
      const { node } = path;
      if (!selection.isInsideNode(node)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      const ifBranch = node.consequent;
      const elseBranch = node.alternate;
      node.consequent = elseBranch;
      node.alternate = ifBranch;
      node.test = getNegatedIfTest(node.test);
    }
  });
}

function hasChildWhichMatchesSelection(
  path: t.NodePath,
  selection: Selection
): boolean {
  let result = false;

  path.traverse({
    ConditionalExpression(childPath) {
      if (!selection.isInsidePath(childPath)) return;

      result = true;
      childPath.stop();
    }
  });

  return result;
}

function getNegatedIfTest(
  test: t.ConditionalExpression["test"]
): t.ConditionalExpression["test"] {
  // Simplify double-negations
  if (t.isUnaryExpression(test)) {
    return test.argument;
  }

  // Simplify simple binary expressions
  // E.g. `a > b` => `a <= b` instead of `!(a > b)`
  if (t.isBinaryExpression(test)) {
    return {
      ...test,
      operator: getNegatedBinaryOperator(test.operator)
    };
  }

  return t.unaryExpression("!", test, true);
}
