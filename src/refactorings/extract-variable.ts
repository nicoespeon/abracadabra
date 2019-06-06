import { Code, WritableEditor } from "./i-write-updates";
import { DelegateToEditor } from "./i-delegate-to-editor";
import { ShowErrorMessage, ErrorReason } from "./i-show-error-message";
import { renameSymbol } from "./rename-symbol";
import { Selection } from "./selection";
import * as ast from "./ast";

export { extractVariable };

async function extractVariable(
  code: Code,
  selection: Selection,
  editor: WritableEditor,
  delegateToEditor: DelegateToEditor,
  showErrorMessage: ShowErrorMessage
) {
  let foundPath: ExtractablePath | undefined;
  let foundLoc: ast.SourceLocation | undefined;

  ast.traverseAST(code, {
    enter(path) {
      if (!isExtractablePath(path)) return;
      if (!selection.isInside(Selection.fromAST(path.node.loc))) return;
      if (isPartOfMemberExpression(path)) return;
      if (isClassPropertyIdentifier(path)) return;
      // Don't extract object method because we don't handle `this`.
      if (ast.isObjectMethod(path.node)) return;

      foundPath = path;
      foundLoc = ast.isObjectProperty(path.node)
        ? findObjectPropertyLoc(selection, path.node) || foundLoc
        : path.node.loc;
    }
  });

  if (!foundPath || !foundLoc) {
    showErrorMessage(ErrorReason.DidNotFoundExtractedCode);
    return;
  }

  const variableName = "extracted";
  const extractedCodeSelection = Selection.fromAST(foundLoc);
  const indentation = " ".repeat(
    extractedCodeSelection.getIndentationLevel(foundPath)
  );
  const extractedCode = editor.read(extractedCodeSelection);

  await editor.write([
    // Insert new variable declaration.
    {
      code: `const ${variableName} = ${extractedCode};\n${indentation}`,
      selection: extractedCodeSelection.putCursorAtScopeParentPosition(
        foundPath
      )
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
    ast.isClassProperty(path.parent);

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

function isPartOfMemberExpression(path: ExtractablePath): boolean {
  return ast.isIdentifier(path.node) && ast.isMemberExpression(path.parent);
}

type ExtractablePath = ast.NodePath<ExtractableNode>;
type ExtractableNode = Extractable<ast.Node>;
type ExtractableObjectProperty = Extractable<ast.ObjectProperty>;
type Extractable<T> = T & { loc: ast.SourceLocation };
