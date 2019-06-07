import { Code, WritableEditor } from "./i-write-updates";
import { DelegateToEditor } from "./i-delegate-to-editor";
import { ShowErrorMessage, ErrorReason } from "./i-show-error-message";
import { renameSymbol } from "./rename-symbol";
import { Selection } from "./selection";
import * as ast from "./ast";

export { extractVariable, canBeExtractedAsVariable };

async function extractVariable(
  code: Code,
  selection: Selection,
  editor: WritableEditor,
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
  const extractedCode = editor.read(extractedCodeSelection);

  await editor.write([
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
  node: ExtractableObjectProperty
): ast.SourceLocation | null {
  const isPropertyValueSelected =
    isExtractableNode(node.value) &&
    selection.isInside(Selection.fromAST(node.value.loc));

  if (isPropertyValueSelected) return node.value.loc;
  if (node.computed) return node.key.loc;

  // Non-computed properties can't be extracted.
  // It will extract the whole object instead.
  return null;
}

function isExtractablePath(path: ast.NodePath): path is ExtractablePath {
  const isInExtractableContext =
    ast.isExpression(path.parent) ||
    ast.isReturnStatement(path.parent) ||
    ast.isVariableDeclarator(path.parent) ||
    ast.isClassProperty(path.parent) ||
    ast.isIfStatement(path.parent) ||
    ast.isWhileStatement(path.parent) ||
    ast.isSwitchCase(path.parent);

  return isInExtractableContext && isExtractableNode(path.node);
}

function isExtractableNode(node: ast.Node): node is ExtractableNode {
  return !!node.loc;
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

function isPartOfMemberExpression(path: ExtractablePath): boolean {
  return ast.isIdentifier(path.node) && ast.isMemberExpression(path.parent);
}

type ExtractableCode = {
  path: ExtractablePath | undefined;
  loc: ast.SourceLocation | undefined;
};
type ExtractablePath = ast.NodePath<ExtractableNode>;
type ExtractableNode = Extractable<ast.Node>;
type ExtractableObjectProperty = Extractable<ast.ObjectProperty>;
type Extractable<T> = T & { loc: ast.SourceLocation };
