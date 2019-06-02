import { Code, WriteUpdates } from "./i-write-updates";
import { DelegateToEditor } from "./i-delegate-to-editor";
import { ShowErrorMessage, ErrorReason } from "./i-show-error-message";
import { renameSymbol } from "./rename-symbol";
import { Selection } from "./selection";
import * as ast from "./ast";

export { extractVariable };

async function extractVariable(
  code: Code,
  selection: Selection,
  writeUpdates: WriteUpdates,
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
  const indentationLevel = selection.findIndentationLevel(foundPath);
  const indentation = " ".repeat(indentationLevel);
  const extractedCode = getExtractedCode(foundPath.node);
  const variableDeclaration = `const ${variableName} = ${extractedCode};\n${indentation}`;

  await writeUpdates([
    // Insert variable declaration.
    {
      code: variableDeclaration,
      selection: selection.putCursorAtColumn(indentationLevel)
    },
    // Replace extracted code with variable.
    {
      code: variableName,
      selection: Selection.fromAST(foundPath.node.loc)
    }
  ]);

  // Extracted symbol is located at `selection` => just trigger a rename.
  await renameSymbol(delegateToEditor);
}

function getExtractedCode(node: ExtractableNode): any {
  if (ast.isStringLiteral(node)) {
    // The `raw` value contains the string quotes (" or ').
    return node.extra.raw;
  } else if (ast.isNullLiteral(node)) {
    return null;
  } else if (ast.isUndefinedLiteral(node)) {
    return undefined;
  } else {
    return node.value;
  }
}

function isExtractablePath(path: ast.NodePath): path is ExtractablePath {
  return (
    (ast.isStringLiteral(path.node) ||
      ast.isNumericLiteral(path.node) ||
      ast.isBooleanLiteral(path.node) ||
      ast.isNullLiteral(path.node) ||
      ast.isUndefinedLiteral(path.node)) &&
    !!path.node.loc
  );
}

type ExtractablePath = ast.NodePath<ExtractableNode>;

type ExtractableNode = (
  | ast.BooleanLiteral
  | ast.Identifier
  | ast.NumericLiteral
  | ast.NullLiteral
  | ast.StringLiteral) & { loc: ast.SourceLocation };
