import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";
import { last, allButLast } from "../../array-helpers";

export { convertSwitchToIfElse, createVisitor as hasSwitchToConvert };

async function convertSwitchToIfElse(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindSwitchToConvert);
    return;
  }

  await editor.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path, convertedNode) => {
      if (t.isBlockStatement(convertedNode)) {
        path.replaceWithMultiple(convertedNode.body);
      } else {
        path.replaceWith(convertedNode);
      }
      path.stop();
    })
  );
}

function createVisitor(
  selection: Selection,
  onMatch: (
    path: t.NodePath<t.SwitchStatement>,
    convertedNode: t.Statement
  ) => void
): t.Visitor {
  return {
    SwitchStatement(path) {
      if (!selection.isInsidePath(path)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      const convertedNode = convert(path.node);
      if (convertedNode === path.node) return;

      onMatch(path, convertedNode);
    }
  };
}

function hasChildWhichMatchesSelection(
  path: t.NodePath,
  selection: Selection
): boolean {
  let result = false;

  path.traverse({
    SwitchStatement(childPath) {
      if (!selection.isInsidePath(childPath)) return;

      const convertedNode = convert(childPath.node);
      if (convertedNode === childPath.node) return;

      result = true;
      childPath.stop();
    }
  });

  return result;
}

function convert(node: t.SwitchStatement): t.Statement {
  try {
    return convertNode(node);
  } catch (err) {
    return node;
  }
}

function convertNode(node: t.SwitchStatement): t.Statement {
  const statements: t.Statement[] = [];
  const fallthroughTests: t.BinaryExpression[] = [];

  node.cases.forEach((caseNode, index) => {
    const isLast = index === node.cases.length - 1;

    if (!caseNode.test) {
      if (!isLast) {
        throw new Error("default case can only be the last case");
      }

      statements.push(caseWithoutBreak(caseNode, isLast));
      return;
    }

    let test: t.Expression = t.binaryExpression(
      "===",
      node.discriminant,
      caseNode.test
    );
    if (caseNode.consequent.length === 0) {
      fallthroughTests.push(test);
      return;
    }

    if (fallthroughTests.length > 0) {
      fallthroughTests.reverse();
      for (const fallthroughTest of fallthroughTests) {
        test = t.logicalExpression("||", fallthroughTest, test);
      }
      fallthroughTests.splice(0, fallthroughTests.length);
    }

    const statement = t.ifStatement(test, caseWithoutBreak(caseNode, isLast));
    statements.push(statement);
  });

  return linkIfStatements(node, statements);
}

function linkIfStatements(node: t.SwitchStatement, statements: t.Statement[]) {
  if (statements.length === 0) {
    return t.ifStatement(node.discriminant, t.blockStatement([]));
  }

  const firstStatement = statements[0];
  if (!t.isIfStatement(firstStatement)) {
    throw new Error(
      "Cannot convert switch statement with just a single default case."
    );
  }

  if (statements.length === 1) {
    return firstStatement;
  }

  const allEndWithReturn = node.cases.every(
    caseNode =>
      t.isReturnStatement(last(caseNode.consequent)) ||
      caseNode.consequent.length === 0
  );

  if (allEndWithReturn) {
    const body = allButLast(statements);
    const lastStatement = last(statements);
    if (lastStatement) {
      if (t.isBlockStatement(lastStatement)) {
        body.push(...lastStatement.body);
      } else {
        body.push(lastStatement);
      }
    }

    return t.blockStatement(body);
  }

  for (let i = 0; i < statements.length - 1; i++) {
    const statement = statements[i];
    if (t.isIfStatement(statement)) {
      statement.alternate = statements[i + 1];
    }
  }

  return firstStatement;
}

function caseWithoutBreak(caseNode: t.SwitchCase, isLastCase: boolean) {
  const lastStatement = last(caseNode.consequent);
  if (lastStatement) {
    if (t.isBreakStatement(lastStatement)) {
      return t.blockStatement(allButLast(caseNode.consequent));
    }

    if (t.isReturnStatement(lastStatement) || !caseNode.test) {
      return t.blockStatement(caseNode.consequent);
    }
  }

  if (isLastCase) {
    return t.blockStatement(caseNode.consequent);
  }

  throw new Error(
    "Can only convert non-empty switch cases ending with break or return statements."
  );
}
