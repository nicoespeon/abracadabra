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

  ast.traverseAST(code, {
    enter(path) {
      if (
        isExtractablePath(path) &&
        selection.isInside(Selection.fromAST(path.node.loc))
      ) {
        foundPath = path;
      }
    }
  });

  if (!foundPath) {
    showErrorMessage(ErrorReason.DidNotFoundExtractedCode);
    return;
  }

  const variableName = "extracted";
  const extractedCodeSelection = Selection.fromAST(foundPath.node.loc);
  const indentationLevel = selection.findIndentationLevel(foundPath);
  const indentation = " ".repeat(indentationLevel);
  const extractedCode = editor.read(extractedCodeSelection);

  await editor.write([
    // Insert new variable declaration.
    {
      code: `const ${variableName} = ${extractedCode};\n${indentation}`,
      selection: selection.putCursorAtColumn(indentationLevel)
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

function isExtractablePath(path: ast.NodePath): path is ExtractablePath {
  const isExtractableType =
    ast.isStringLiteral(path.node) ||
    ast.isNumericLiteral(path.node) ||
    ast.isBooleanLiteral(path.node) ||
    ast.isNullLiteral(path.node) ||
    ast.isUndefinedLiteral(path.node) ||
    ast.isArrayExpression(path.node) ||
    ast.isObjectExpression(path.node);

  return isExtractableType && !!path.node.loc;
}

type ExtractablePath = ast.NodePath<ExtractableNode>;

type ExtractableNode = (
  | ast.ArrayExpression
  | ast.BooleanLiteral
  | ast.Identifier
  | ast.NumericLiteral
  | ast.NullLiteral
  | ast.StringLiteral) & { loc: ast.SourceLocation };
