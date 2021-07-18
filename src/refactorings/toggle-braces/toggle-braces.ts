import { Editor, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";
import { Position } from "../../editor/position";

export { toggleBraces, createVisitor };

async function toggleBraces(editor: Editor) {
  const { code, selection } = editor;
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindStatementToToggleBraces);
    return;
  }

  await editor.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(
      selection,
      (path) => {
        if (t.isIfStatement(path.node)) {
          if (!t.isSelectableNode(path.node.consequent)) return;
          const endOfConsequent = Position.fromAST(
            path.node.consequent.loc.end
          );

          if (selection.start.isBefore(endOfConsequent)) {
            path.node.consequent = t.statementWithBraces(path.node.consequent);
            return;
          }

          if (path.node.alternate) {
            path.node.alternate = t.statementWithBraces(path.node.alternate);
          }
        } else if (t.isJSXAttribute(path.node)) {
          // Wrap the string literal in a JSX Expression
          if (path.node.value && !t.isJSXExpressionContainer(path.node.value)) {
            path.node.value = t.jsxExpressionContainer(path.node.value);
          }
        } else if (t.isArrowFunctionExpression(path.node)) {
          // Duplicate this type guard so TS can infer the type properly
          if (t.isBlockStatement(path.node.body)) return;

          const blockStatement = t.blockStatement([
            t.returnStatement(path.node.body)
          ]);
          path.node.body = blockStatement;
        }

        path.stop();
      },
      (path) => {
        if (!t.isSelectableNode(path.node.consequent)) return;
        if (isSelectionBefore(selection, path.node.consequent)) {
          path.node.consequent = statementWithoutBraces(path.node.consequent);
          return;
        }

        if (path.node.alternate) {
          path.node.alternate = statementWithoutBraces(path.node.alternate);
        }

        path.stop();
      }
    )
  );
}

function createVisitor(
  selection: Selection,
  addBraces: (
    path: t.NodePath<t.IfStatement | t.JSXAttribute | t.ArrowFunctionExpression>
  ) => void,
  removeBraces: (path: t.NodePath<t.IfStatement>) => void
): t.Visitor {
  return {
    IfStatement(path) {
      if (!selection.isInsidePath(path)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      if (hasBracesAlready(path, selection)) {
        if (!hasSingleStatementBlock(path, selection)) return;
        removeBraces(path);
      } else {
        addBraces(path);
      }
    },
    JSXAttribute(path) {
      if (!selection.isInsidePath(path)) return;
      if (!t.isStringLiteral(path.node.value)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      addBraces(path);
    },
    ArrowFunctionExpression(path) {
      if (!selection.isInsidePath(path)) return;
      if (t.isBlockStatement(path.node.body)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      addBraces(path);
    }
  };
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
    },
    JSXAttribute(_childPath) {
      // SMELL: could a child match here?
    },
    ArrowFunctionExpression(childPath) {
      if (!selection.isInsidePath(childPath)) return;
      if (t.isBlockStatement(childPath.node.body)) return;

      result = true;
      childPath.stop();
    }
  });

  return result;
}

function isSelectionBefore(
  selection: Selection,
  statement: t.Selectable<t.Statement>
): boolean {
  const endOfStatement = Position.fromAST(statement.loc.end);
  return selection.start.isBefore(endOfStatement);
}

function statementWithoutBraces(node: t.Statement): t.Statement {
  return t.isBlockStatement(node) ? node.body[0] : node;
}

function hasSingleStatementBlock(
  path: t.NodePath<t.IfStatement>,
  selection: Selection
): boolean {
  const { consequent, alternate } = path.node;
  const selectedBranchNode =
    t.isSelectableNode(consequent) && isSelectionBefore(selection, consequent)
      ? consequent
      : alternate;

  if (!selectedBranchNode) return false;

  if (t.isBlockStatement(selectedBranchNode)) {
    return selectedBranchNode.body.length < 2;
  } else {
    return false;
  }
}

function hasBracesAlready(
  path: t.SelectablePath<t.IfStatement>,
  selection: Selection
): boolean {
  const { consequent, alternate } = path.node;
  const ifSelection = Selection.fromAST(path.node.loc);
  const consequentSelection = t.isSelectableNode(consequent)
    ? Selection.fromAST(consequent.loc)
    : selection;
  const ifAndConsequentSelection =
    consequentSelection.extendStartToStartOf(ifSelection);

  if (selection.isInside(ifAndConsequentSelection)) {
    return t.isBlockStatement(consequent);
  } else {
    return alternate === null || t.isBlockStatement(alternate);
  }
}
