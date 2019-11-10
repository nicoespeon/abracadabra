import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";
import { last, allButLast } from "../../array-helpers";

import { getNegatedBinaryOperator } from "../negate-expression/negate-expression";

export { flipIfElse, hasIfElseToFlip };

async function flipIfElse(code: Code, selection: Selection, editor: Editor) {
  const updatedCode = updateCode(t.parse(code), selection);

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

function hasIfElseToFlip(ast: t.AST, selection: Selection): boolean {
  let result = false;

  t.traverseAST(ast, {
    IfStatement(path) {
      const { node } = path;
      if (!selection.isInsideNode(node)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      result = true;
    }
  });

  return result;
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(ast, {
    IfStatement(path) {
      const { node } = path;
      if (!selection.isInsideNode(node)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      if (t.isGuardClause(path)) {
        flipGuardClause(path);
      } else {
        flipIfStatement(path);
      }

      node.test = getNegatedIfTest(node.test);
    }
  });
}

function flipIfStatement(path: t.NodePath<t.IfStatement>) {
  const ifBranch = path.node.consequent;
  const elseBranch = path.node.alternate || t.blockStatement([]);

  path.node.consequent = t.isIfStatement(elseBranch)
    ? t.blockStatement([elseBranch])
    : elseBranch;
  path.node.alternate = ifBranch;
}

function flipGuardClause(path: t.NodePath<t.IfStatement>) {
  const ifBranch = path.node.consequent;
  const pathsBelow = path
    .getAllNextSiblings()
    .filter((path): path is t.NodePath<t.Statement> => t.isStatement(path));
  const nodesBelow: t.Statement[] = pathsBelow.map(path => path.node);

  path.node.consequent = t.blockStatement(nodesBelow);
  path.node.alternate = flipToGuardAlternate(ifBranch);
  pathsBelow.forEach(path => path.remove());
}

function flipToGuardAlternate(
  consequent: t.Statement
): t.BlockStatement | null {
  if (t.isNonEmptyReturn(consequent)) {
    return t.blockStatement([consequent]);
  }

  if (!t.isGuardConsequentBlock(consequent)) return null;

  const finalReturnStatement = last(consequent.body);
  if (!finalReturnStatement) return null;

  const alternateBody = t.isNonEmptyReturn(finalReturnStatement)
    ? consequent.body
    : allButLast(consequent.body);

  if (alternateBody.length === 0) return null;

  return t.blockStatement(alternateBody);
}

function hasChildWhichMatchesSelection(
  path: t.NodePath,
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

function getNegatedIfTest(test: t.IfStatement["test"]): t.IfStatement["test"] {
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
