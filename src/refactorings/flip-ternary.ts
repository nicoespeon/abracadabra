import { Code, Write } from "./editor/i-write-code";
import { Selection } from "./editor/selection";
import { ShowErrorMessage, ErrorReason } from "./editor/i-show-error-message";
import * as ast from "./ast";
import { getNegatedBinaryOperator } from "./negate-expression";

export { flipTernary, hasTernaryToFlip };

async function flipTernary(
  code: Code,
  selection: Selection,
  write: Write,
  showErrorMessage: ShowErrorMessage
) {
  const updatedCode = updateCode(code, selection);

  if (!updatedCode.hasSelectedNode || !updatedCode.loc) {
    showErrorMessage(ErrorReason.DidNotFoundTernaryToFlip);
    return;
  }

  await write([
    {
      code: updatedCode.code,
      selection: Selection.fromAST(updatedCode.loc)
    }
  ]);
}

function hasTernaryToFlip(code: Code, selection: Selection): boolean {
  return updateCode(code, selection).hasSelectedNode;
}

function updateCode(code: Code, selection: Selection): ast.Transformed {
  return ast.transform(code, selectNode => ({
    ConditionalExpression({ node }) {
      if (!ast.isSelectableNode(node)) return;
      if (!selection.isInside(Selection.fromAST(node.loc))) return;

      const ifBranch = node.consequent;
      const elseBranch = node.alternate;
      node.consequent = elseBranch;
      node.alternate = ifBranch;
      node.test = getNegatedIfTest(node.test);

      selectNode(node);
    }
  }));
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
