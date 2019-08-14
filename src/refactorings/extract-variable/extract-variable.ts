import { Code, Write } from "../../editor/i-write-code";
import { DelegateToEditor } from "../../editor/i-delegate-to-editor";
import {
  ShowErrorMessage,
  ErrorReason
} from "../../editor/i-show-error-message";
import { Selection } from "../../editor/selection";
import * as ast from "../../ast";
import { renameSymbol } from "../rename-symbol/rename-symbol";

export { extractVariable };

async function extractVariable(
  code: Code,
  selection: Selection,
  write: Write,
  showErrorMessage: ShowErrorMessage,
  delegateToEditor: DelegateToEditor
) {
  const updatedCode = updateCode(code, selection);

  if (!updatedCode.hasCodeChanged) {
    showErrorMessage(ErrorReason.DidNotFoundExtractableCode);
    return;
  }

  await write(updatedCode.code);

  // Extracted symbol is located at `selection` => just trigger a rename.
  await renameSymbol(delegateToEditor);
}

function updateCode(code: Code, selection: Selection): ast.Transformed {
  const extractInSelectedNode = (
    path: ast.NodePath<ast.VariableDeclarator["init"]>
  ) => extractInNode(path, selection);

  return ast.transform(code, {
    StringLiteral: extractInSelectedNode,
    NumericLiteral: extractInSelectedNode,
    BooleanLiteral: extractInSelectedNode,
    NullLiteral: extractInSelectedNode,
    Identifier(path) {
      if (isClassPropertyIdentifier(path)) return;
      extractInSelectedNode(path);
    },
    ArrayExpression: extractInSelectedNode,
    ObjectExpression: extractInSelectedNode,
    ObjectProperty(path) {
      if (isInsideValue(path, selection)) {
        return extractInObjectProperty("value", path, selection);
      }

      if (isInsideExtractableKey(path, selection)) {
        return extractInObjectProperty("key", path, selection);
      }
    },
    FunctionExpression: extractInSelectedNode,
    ArrowFunctionExpression: extractInSelectedNode,
    CallExpression: extractInSelectedNode,
    MemberExpression: extractInSelectedNode,
    TemplateLiteral: extractInSelectedNode,
    LogicalExpression: extractInSelectedNode,
    BinaryExpression: extractInSelectedNode
  });
}

function extractInNode(
  path: ast.NodePath<ast.VariableDeclarator["init"]>,
  selection: Selection
) {
  const { node } = path;
  if (!node) return;
  if (!selection.isInsideNode(node)) return;
  if (!isExtractableContext(path.parent)) return;
  if (hasChildWhichMatchesSelection(path, selection)) return;

  const scopePath = findScopePath(path);
  if (!scopePath) return;

  insertVariableBefore(scopePath, node);
  path.replaceWith(variableId());

  scopePath.stop();
  path.stop();
}

function extractInObjectProperty(
  nodeKey: "key" | "value",
  path: ast.NodePath<ast.ObjectProperty>,
  selection: Selection
) {
  const node = path.node[nodeKey];
  if (!ast.isExpression(node)) return;
  if (hasChildWhichMatchesSelection(path, selection)) return;

  const scopePath = findScopePath(path);
  if (!scopePath) return;

  insertVariableBefore(scopePath, node);
  path.node[nodeKey] = variableId();

  scopePath.stop();
}

function insertVariableBefore(
  path: ast.NodePath,
  init: ast.VariableDeclarator["init"]
) {
  path.insertBefore([
    ast.variableDeclaration("const", [
      ast.variableDeclarator(variableId(), init)
    ])
  ]);
}

function variableId(): ast.Identifier {
  return ast.identifier("extracted");
}

// Since we visit nodes from parent to children, first check
// if a child would match the selection closer.
function hasChildWhichMatchesSelection(
  path: ast.NodePath<ast.Node | null>,
  selection: Selection
): boolean {
  let result = false;

  path.traverse({
    StringLiteral: checkIfMatches,
    NumericLiteral: checkIfMatches,
    BooleanLiteral: checkIfMatches,
    NullLiteral: checkIfMatches,
    Identifier(childPath) {
      if (isFunctionCallIdentifier(childPath)) return;
      if (ast.isMemberExpression(childPath.parent)) return;
      checkIfMatches(childPath);
    },
    ArrayExpression: checkIfMatches,
    ObjectExpression: checkIfMatches,
    ObjectProperty: childPath => {
      if (
        !isInsideExtractableKey(childPath, selection) &&
        !isInsideValue(childPath, selection)
      ) {
        return;
      }
      checkIfMatches(childPath);
    },
    FunctionExpression: checkIfMatches,
    ArrowFunctionExpression: checkIfMatches,
    CallExpression: checkIfMatches,
    MemberExpression: checkIfMatches,
    BinaryExpression: checkIfMatches
  });

  return result;

  function checkIfMatches(childPath: ast.NodePath) {
    if (!childPath.node) return;
    if (!selection.isInsideNode(childPath.node)) return;
    if (!isExtractableContext(childPath.parent)) return;

    result = true;
    childPath.stop();
  }
}

function findScopePath(
  path: ast.NodePath<ast.Node | null>
): ast.NodePath | undefined {
  return path.findParent(
    parentPath =>
      ast.isExpressionStatement(parentPath) ||
      ast.isVariableDeclaration(parentPath) ||
      ast.isReturnStatement(parentPath) ||
      ast.isClassDeclaration(parentPath) ||
      ast.isIfStatement(parentPath) ||
      ast.isWhileStatement(parentPath) ||
      ast.isSwitchStatement(parentPath)
  );
}

function isInsideExtractableKey(
  path: ast.NodePath<ast.ObjectProperty>,
  selection: Selection
): boolean {
  return selection.isInsideNode(path.node.key) && path.node.computed;
}

function isInsideValue(
  path: ast.NodePath<ast.ObjectProperty>,
  selection: Selection
): boolean {
  return selection.isInsideNode(path.node.value);
}

function isExtractableContext(node: ast.Node): boolean {
  return (
    (ast.isExpression(node) && !ast.isArrowFunctionExpression(node)) ||
    ast.isReturnStatement(node) ||
    ast.isVariableDeclarator(node) ||
    ast.isClassProperty(node) ||
    ast.isIfStatement(node) ||
    ast.isWhileStatement(node) ||
    ast.isSwitchCase(node)
  );
}

function isFunctionCallIdentifier(path: ast.NodePath): boolean {
  return ast.isCallExpression(path.parent) && path.parent.callee === path.node;
}

function isClassPropertyIdentifier(path: ast.NodePath): boolean {
  return (
    ast.isClassProperty(path.parent) &&
    !path.parent.computed &&
    ast.isIdentifier(path.node)
  );
}
