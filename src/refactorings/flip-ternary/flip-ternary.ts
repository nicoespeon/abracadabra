import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as ast from "../../ast";

import { getNegatedBinaryOperator } from "../negate-expression/negate-expression";

export { flipTernary, hasTernaryToFlip };

async function flipTernary(code: Code, selection: Selection, editor: Editor) {
  const updatedCode = updateCode(code, selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFoundTernaryToFlip);
    return;
  }

  await editor.write(updatedCode.code);
}

function hasTernaryToFlip(code: Code, selection: Selection): boolean {
  return updateCode(code, selection).hasCodeChanged;
}

function updateCode(code: Code, selection: Selection): ast.Transformed {
  return ast.transform(code, {
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
  path: ast.NodePath,
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
  test: ast.ConditionalExpression["test"]
): ast.ConditionalExpression["test"] {
  // Simplify double-negations
  if (ast.isUnaryExpression(test)) {
    return test.argument;
  }

  // Simplify simple binary expressions
  // E.g. `a > b` => `a <= b` instead of `!(a > b)`
  if (ast.isBinaryExpression(test)) {
    return {
      ...test,
      operator: getNegatedBinaryOperator(test.operator)
    };
  }

  return ast.unaryExpression("!", test, true);
}
