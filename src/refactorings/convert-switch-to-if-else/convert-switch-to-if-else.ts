import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";
import { last } from "../../array-helpers";

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
      path.replaceWith(convertedNode);
      path.stop();
    })
  );
}

function createVisitor(
  selection: Selection,
  onMatch: (
    path: t.NodePath<t.SwitchStatement>,
    convertedNode: t.IfStatement | t.SwitchStatement
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

function convert(node: t.SwitchStatement): t.SwitchStatement | t.IfStatement {
  try {
    return convertNode(node);
  } catch (err) {
    return node;
  }
}

function convertNode(node: t.SwitchStatement) {
  let rootStatement: t.IfStatement | undefined;
  let currentStatement: t.IfStatement | undefined;

  node.cases.forEach((caseNode, index) => {
    const isLast = index === node.cases.length - 1;

    if (!caseNode.test) {
      if (!isLast) {
        throw new Error("default case can only be the last case");
      }

      if (currentStatement) {
        currentStatement.alternate = caseWithoutBreak(caseNode, isLast);
      }

      return;
    }

    const test = t.binaryExpression("===", node.discriminant, caseNode.test);
    const newNode = t.ifStatement(test, caseWithoutBreak(caseNode, isLast));

    if (currentStatement) {
      currentStatement.alternate = newNode;
    }
    currentStatement = newNode;

    if (!rootStatement) {
      rootStatement = newNode;
    }
  });

  if (!rootStatement) {
    return t.ifStatement(node.discriminant, t.blockStatement([]));
  }

  return rootStatement;
}

function caseWithoutBreak(caseNode: t.SwitchCase, isLast: boolean) {
  const lastStatement = last(caseNode.consequent);
  if (lastStatement) {
    if (lastStatement.type === "BreakStatement") {
      return t.blockStatement(caseNode.consequent.slice(0, -1));
    }

    if (lastStatement.type === "ReturnStatement" || !caseNode.test) {
      return t.blockStatement(caseNode.consequent);
    }
  }

  if (isLast) {
    return t.blockStatement(caseNode.consequent);
  }

  throw new Error(
    "Can only convert switch cases ending with break or return statements."
  );
}
