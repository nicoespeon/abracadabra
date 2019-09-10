import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as ast from "../../ast";
import { last, allButLast } from "../../array-helpers";

import { getNegatedBinaryOperator } from "../negate-expression/negate-expression";

export { flipIfElse, hasIfElseToFlip };

async function flipIfElse(code: Code, selection: Selection, editor: Editor) {
  const updatedCode = updateCode(code, selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFoundIfElseToFlip);
    return;
  }

  await editor.write(
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
    IfStatement(path) {
      const { node } = path;
      if (!selection.isInsideNode(node)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      if (ast.isGuardClause(path)) {
        flipGuardClause(path);
      } else {
        flipIfStatement(path);
      }

      node.test = getNegatedIfTest(node.test);
    }
  });
}

function flipIfStatement(path: ast.NodePath<ast.IfStatement>) {
  const ifBranch = path.node.consequent;
  const elseBranch = path.node.alternate || ast.blockStatement([]);

  path.node.consequent = ast.isIfStatement(elseBranch)
    ? ast.blockStatement([elseBranch])
    : elseBranch;
  path.node.alternate = ifBranch;
}

function flipGuardClause(path: ast.NodePath<ast.IfStatement>) {
  const ifBranch = path.node.consequent;
  const pathsBelow = path
    .getAllNextSiblings()
    .filter(
      (path): path is ast.NodePath<ast.Statement> => ast.isStatement(path)
    );
  const nodesBelow: ast.Statement[] = pathsBelow.map(path => path.node);

  path.node.consequent = ast.blockStatement(nodesBelow);
  path.node.alternate = flipToGuardAlternate(ifBranch);
  pathsBelow.forEach(path => path.remove());
}

function flipToGuardAlternate(
  consequent: ast.Statement
): ast.BlockStatement | null {
  if (ast.isNonEmptyReturn(consequent)) {
    return ast.blockStatement([consequent]);
  }

  if (!ast.isGuardConsequentBlock(consequent)) return null;

  const finalReturnStatement = last(consequent.body);
  if (!finalReturnStatement) return null;

  const alternateBody = ast.isNonEmptyReturn(finalReturnStatement)
    ? consequent.body
    : allButLast(consequent.body);

  if (alternateBody.length === 0) return null;

  return ast.blockStatement(alternateBody);
}

function hasChildWhichMatchesSelection(
  path: ast.NodePath,
  selection: Selection
): boolean {
  let result = false;

  path.traverse({
    IfStatement(childPath) {
      if (!selection.isInsidePath(childPath)) return;

      result = true;
      childPath.stop();
    }
  });

  return result;
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
