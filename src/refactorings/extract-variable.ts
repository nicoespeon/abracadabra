import { ReadThenWrite, Code } from "./i-write-code";
import { DelegateToEditor } from "./i-delegate-to-editor";
import { ShowErrorMessage, ErrorReason } from "./i-show-error-message";
import { renameSymbol } from "./rename-symbol";
import { Selection } from "./selection";
import * as ast from "./ast";

export { extractVariable };

async function extractVariable(
  code: Code,
  selection: Selection,
  readThenWrite: ReadThenWrite,
  delegateToEditor: DelegateToEditor,
  showErrorMessage: ShowErrorMessage
) {
  const { path, loc, shouldWrapInJSXExpressionContainer } = findExtractableCode(
    code,
    selection
  );

  if (!path || !loc) {
    showErrorMessage(ErrorReason.DidNotFoundExtractableCode);
    return;
  }

  const variableName = "extracted";
  const extractedCodeSelection = Selection.fromAST(loc);
  const indentation = " ".repeat(
    extractedCodeSelection.getIndentationLevel(path)
  );

  await readThenWrite(extractedCodeSelection, extractedCode => [
    // Insert new variable declaration.
    {
      code: `const ${variableName} = ${extractedCode};\n${indentation}`,
      selection: extractedCodeSelection.putCursorAtScopeParentPosition(path)
    },
    // Replace extracted code with new variable.
    {
      code: shouldWrapInJSXExpressionContainer
        ? `{${variableName}}`
        : variableName,
      selection: extractedCodeSelection
    }
  ]);

  // Extracted symbol is located at `selection` => just trigger a rename.
  await renameSymbol(delegateToEditor);
}

function findExtractableCode(
  code: Code,
  selection: Selection
): ExtractableCode {
  let result: ExtractableCode = {
    path: undefined,
    loc: undefined,
    shouldWrapInJSXExpressionContainer: false
  };

  ast.traverseAST(code, {
    enter(path) {
      if (!isExtractableContext(path.parent)) return;

      if (isPartOfMemberExpression(path)) return;
      if (isClassPropertyIdentifier(path)) return;
      if (isVariableDeclarationIdentifier(path)) return;
      if (isFunctionCallIdentifier(path)) return;
      if (isJSXPartialElement(path)) return;
      if (ast.isTemplateElement(path)) return;
      if (ast.isBlockStatement(path)) return;
      if (ast.isSpreadElement(path)) return;
      // Don't extract object method because we don't handle `this`.
      if (ast.isObjectMethod(path)) return;

      const { node } = path;
      if (!ast.isSelectableNode(node)) return;
      if (!selection.isInside(Selection.fromAST(node.loc))) return;

      result.path = path;
      result.loc = ast.isObjectProperty(node)
        ? findObjectPropertyLoc(selection, node) || result.loc
        : ast.isJSXExpressionContainer(node)
        ? node.expression.loc || result.loc
        : node.loc;
      result.shouldWrapInJSXExpressionContainer =
        ast.isJSX(node) && ast.isJSX(path.parent);
    }
  });

  return result;
}

function findObjectPropertyLoc(
  selection: Selection,
  node: ast.SelectableObjectProperty
): ast.SourceLocation | null {
  const isPropertyValueSelected =
    ast.isSelectableNode(node.value) &&
    selection.isInside(Selection.fromAST(node.value.loc));

  if (isPropertyValueSelected) return node.value.loc;
  if (node.computed) return node.key.loc;

  // Non-computed properties can't be extracted.
  // It will extract the whole object instead.
  return null;
}

function isExtractableContext(node: ast.Node): boolean {
  return (
    ast.isExpression(node) ||
    ast.isReturnStatement(node) ||
    ast.isVariableDeclarator(node) ||
    ast.isClassProperty(node) ||
    ast.isIfStatement(node) ||
    ast.isWhileStatement(node) ||
    ast.isSwitchCase(node)
  );
}

function isClassPropertyIdentifier(path: ast.NodePath): boolean {
  return (
    ast.isClassProperty(path.parent) &&
    !path.parent.computed &&
    ast.isIdentifier(path.node)
  );
}

function isVariableDeclarationIdentifier(path: ast.NodePath): boolean {
  return ast.isVariableDeclarator(path.parent) && ast.isIdentifier(path.node);
}

function isFunctionCallIdentifier(path: ast.NodePath): boolean {
  return ast.isCallExpression(path.parent) && path.parent.callee === path.node;
}

function isJSXPartialElement(path: ast.NodePath): boolean {
  return ast.isJSXOpeningElement(path) || ast.isJSXClosingElement(path);
}

function isPartOfMemberExpression(path: ast.NodePath): boolean {
  return ast.isIdentifier(path.node) && ast.isMemberExpression(path.parent);
}

type ExtractableCode = {
  path: ast.NodePath | undefined;
  loc: ast.SourceLocation | undefined;
  shouldWrapInJSXExpressionContainer: boolean;
};
