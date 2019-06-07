import { UpdateWith, Code } from "./i-update-code";
import { DelegateToEditor } from "./i-delegate-to-editor";
import { ShowErrorMessage, ErrorReason } from "./i-show-error-message";
import { renameSymbol } from "./rename-symbol";
import { Selection } from "./selection";
import * as ast from "./ast";

export { extractVariable, canBeExtractedAsVariable };

async function extractVariable(
  code: Code,
  selection: Selection,
  updateWith: UpdateWith,
  delegateToEditor: DelegateToEditor,
  showErrorMessage: ShowErrorMessage
) {
  const { path, loc } = findExtractableCode(code, selection);

  if (!path || !loc) {
    showErrorMessage(ErrorReason.DidNotFoundExtractableCode);
    return;
  }

  const variableName = "extracted";
  const extractedCodeSelection = Selection.fromAST(loc);
  const indentation = " ".repeat(
    extractedCodeSelection.getIndentationLevel(path)
  );

  await updateWith(extractedCodeSelection, extractedCode => [
    // Insert new variable declaration.
    {
      code: `const ${variableName} = ${extractedCode};\n${indentation}`,
      selection: extractedCodeSelection.putCursorAtScopeParentPosition(path)
    },
    // Replace extracted code with new variable.
    {
      code: variableName,
      selection: extractedCodeSelection
    }
  ]);

  // Extracted symbol is located at `selection` => just trigger a rename.
  await renameSymbol(delegateToEditor);
}

function canBeExtractedAsVariable(code: Code, selection: Selection): boolean {
  const { path, loc } = findExtractableCode(code, selection);
  return !!(path && loc);
}

function findExtractableCode(
  code: Code,
  selection: Selection
): ExtractableCode {
  let result: ExtractableCode = {
    path: undefined,
    loc: undefined
  };

  ast.traverseAST(code, {
    enter(path) {
      if (!isExtractablePath(path)) return;
      if (!selection.isInside(Selection.fromAST(path.node.loc))) return;
      if (isPartOfMemberExpression(path)) return;
      if (isClassPropertyIdentifier(path)) return;
      if (isVariableDeclarationIdentifier(path)) return;
      if (ast.isTemplateElement(path)) return;
      if (ast.isBlockStatement(path)) return;
      // Don't extract object method because we don't handle `this`.
      if (ast.isObjectMethod(path.node)) return;

      result.path = path;
      result.loc = ast.isObjectProperty(path.node)
        ? findObjectPropertyLoc(selection, path.node) || result.loc
        : path.node.loc;
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

function isExtractablePath(path: ast.NodePath): path is ast.SelectablePath {
  const isInExtractableContext =
    ast.isExpression(path.parent) ||
    ast.isReturnStatement(path.parent) ||
    ast.isVariableDeclarator(path.parent) ||
    ast.isClassProperty(path.parent) ||
    ast.isIfStatement(path.parent) ||
    ast.isWhileStatement(path.parent) ||
    ast.isSwitchCase(path.parent);

  return isInExtractableContext && ast.isSelectableNode(path.node);
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

function isPartOfMemberExpression(path: ast.SelectablePath): boolean {
  return ast.isIdentifier(path.node) && ast.isMemberExpression(path.parent);
}

type ExtractableCode = {
  path: ast.SelectablePath | undefined;
  loc: ast.SourceLocation | undefined;
};
