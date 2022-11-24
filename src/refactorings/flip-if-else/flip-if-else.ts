import { Editor, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";
import { last, allButLast } from "../../array";

import { getNegatedBinaryOperator } from "../invert-boolean-logic/invert-boolean-logic";

export async function flipIfElse(editor: Editor) {
  const { code, selection } = editor;
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindIfElseToFlip);
    return;
  }

  await editor.write(
    updatedCode.code
      // Recast doesn't format empty block statement as expected
      // Until it's fixed, parse this pattern manually
      // https://github.com/benjamn/recast/issues/612
      .replace(/\)\n\s*{} else {/, ") {} else {")
      // Created guard clause puts the return on the next line
      // Make it one-line so it's easier to read
      .replace(/\)\n\s*return/, ") return")
  );
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path: t.NodePath<t.IfStatement>) => {
      if (t.isGuardClause(path)) {
        flipGuardClause(path);
      } else {
        flipIfStatement(path);
      }

      const { node } = path;
      node.test = getNegatedIfTest(node.test);
    })
  );
}

export function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<t.IfStatement>) => void
): t.Visitor {
  return {
    IfStatement(path) {
      const { node } = path;
      if (!selection.isInsideNode(node)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      onMatch(path);
    }
  };
}

function flipIfStatement(path: t.NodePath<t.IfStatement>) {
  if (canBeTurnedIntoGuardClause(path)) {
    const body = t.getStatements(path.node.consequent);
    path.node.consequent = isInLoop(path)
      ? t.blockStatement([t.continueStatement()])
      : t.returnStatement();
    path.insertAfter(body);
  } else {
    const ifBranch = path.node.consequent;
    const elseBranch = path.node.alternate || t.blockStatement([]);

    path.node.consequent = t.isIfStatement(elseBranch)
      ? t.blockStatement([elseBranch])
      : elseBranch;
    path.node.alternate = ifBranch;
  }
}

function isInLoop(path: t.NodePath): boolean {
  return Boolean(path.findParent((parentPath) => parentPath.isLoop()));
}

function canBeTurnedIntoGuardClause(path: t.NodePath<t.IfStatement>): boolean {
  return !path.node.alternate && t.getNodesBelow(path).length === 0;
}

function flipGuardClause(path: t.NodePath<t.IfStatement>) {
  const ifBranch = path.node.consequent;
  path.node.consequent = t.blockStatement(t.getNodesBelow(path));
  path.node.alternate = flipToGuardAlternate(ifBranch);
  t.getPathsBelow(path).forEach((path) => path.remove());
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
    const negatedOperator = getNegatedBinaryOperator(test.operator);

    // Some operators can't be negated => negate the whole expression
    if (negatedOperator === test.operator) {
      return t.unaryExpression("!", test);
    }

    return {
      ...test,
      operator: negatedOperator
    };
  }

  return t.unaryExpression("!", test);
}
