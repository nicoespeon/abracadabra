import { Code, Write } from "./editor/i-write-code";
import { Selection } from "./editor/selection";
import { ShowErrorMessage, ErrorReason } from "./editor/i-show-error-message";
import * as ast from "./ast";
import { getNegatedBinaryOperator } from "./negate-expression";

export { flipIfElse, hasIfElseToFlip };

async function flipIfElse(
  code: Code,
  selection: Selection,
  write: Write,
  showErrorMessage: ShowErrorMessage
) {
  const updatedCode = updateCode(code, selection);

  if (!updatedCode.hasCodeChanged) {
    showErrorMessage(ErrorReason.DidNotFoundIfElseToFlip);
    return;
  }

  await write(
    updatedCode.code
      // Recast doesn't format empty block statement as expected
      // Until it's fixed, parse this pattern manually
      // https://github.com/benjamn/recast/issues/612
      .replace(/\)\n\s*{} else {/, ") {} else {")
  );
}

function hasIfElseToFlip(code: Code, selection: Selection): boolean {
  return updateCode(code, selection).hasCodeChanged;
}

function updateCode(code: Code, selection: Selection): ast.Transformed {
  return ast.transform(code, {
    IfStatement({ node }) {
      if (!ast.isSelectableNode(node)) return;
      if (!selection.isInside(Selection.fromAST(node.loc))) return;

      const ifBranch = node.consequent;
      const elseBranch = node.alternate || ast.blockStatement([]);
      node.consequent = elseBranch;
      node.alternate = ifBranch;
      node.test = getNegatedIfTest(node.test);
    }
  });
}

function getNegatedIfTest(
  test: ast.IfStatement["test"]
): ast.IfStatement["test"] {
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
