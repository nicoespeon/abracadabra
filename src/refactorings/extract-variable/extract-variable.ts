import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { Position } from "../../editor/position";
import * as ast from "../../ast";

import { renameSymbol } from "../rename-symbol/rename-symbol";

export { extractVariable, ReplaceChoice };

async function extractVariable(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const {
    selectedOccurrence,
    otherOccurrencesLocs,
    parseId,
    parseCode
  } = findExtractableCode(code, selection);

  if (!selectedOccurrence) {
    editor.showError(ErrorReason.DidNotFoundExtractableCode);
    return;
  }

  const { path, loc } = selectedOccurrence;

  const choice = await getChoice(otherOccurrencesLocs, editor);
  if (choice === ReplaceChoice.None) return;

  const variableName = "extracted";
  const extractedSelection = Selection.fromAST(loc);
  const indentation = " ".repeat(extractedSelection.getIndentationLevel(path));

  const cursorOnExtractedId = new Position(
    extractedSelection.start.line + extractedSelection.height + 1,
    extractedSelection.start.character + variableName.length
  );

  const occurrencesSelections =
    choice === ReplaceChoice.AllOccurrences
      ? [extractedSelection].concat(otherOccurrencesLocs.map(Selection.fromAST))
      : [extractedSelection];

  await editor.readThenWrite(
    extractedSelection,
    extractedCode => [
      // Insert new variable declaration.
      {
        code: `const ${variableName} = ${parseCode(
          extractedCode
        )};\n${indentation}`,
        selection: extractedSelection.putCursorAtScopeParentPosition(path)
      },
      // Replace extracted code with new variable.
      ...occurrencesSelections.map(selection => ({
        code: parseId(variableName),
        selection
      }))
    ],
    cursorOnExtractedId
  );

  // Extracted symbol is located at `selection` => just trigger a rename.
  await renameSymbol(editor);
}

async function getChoice(
  otherOccurrencesLocs: ast.SourceLocation[],
  editor: Editor
): Promise<ReplaceChoice> {
  const occurrencesCount = otherOccurrencesLocs.length;
  if (occurrencesCount <= 0) return ReplaceChoice.ThisOccurrence;

  const choice = await editor.askUser([
    {
      value: ReplaceChoice.AllOccurrences,
      label: `Replace all ${occurrencesCount + 1} occurrences`
    },
    {
      value: ReplaceChoice.ThisOccurrence,
      label: "Replace this occurrence only"
    }
  ]);

  return choice ? choice.value : ReplaceChoice.None;
}

enum ReplaceChoice {
  AllOccurrences,
  ThisOccurrence,
  None
}

function findExtractableCode(
  code: Code,
  selection: Selection
): ExtractableCode {
  let result: ExtractableCode = {
    selectedOccurrence: null,
    otherOccurrencesLocs: [],
    parseId: id => id,
    parseCode: code => code
  };

  ast.traverseAST(code, {
    enter(path) {
      if (!isExtractableContext(path.parent)) return;
      if (!isExtractable(path)) return;

      const { node } = path;
      if (!selection.isInsideNode(node)) return;

      const currentLoc = result.selectedOccurrence
        ? result.selectedOccurrence.loc
        : null;
      const loc = ast.isObjectProperty(node)
        ? findObjectPropertyLoc(selection, node) || currentLoc
        : ast.isJSXExpressionContainer(node)
        ? node.expression.loc || currentLoc
        : node.loc;
      if (!loc) return;

      result.selectedOccurrence = { path, loc };

      result.parseId =
        (ast.isJSXElement(node) || ast.isJSXText(node)) &&
        ast.isJSX(path.parent)
          ? id => `{${id}}`
          : id => id;

      result.parseCode = ast.isJSXText(node)
        ? code => `"${code}"`
        : code => code;
    }
  });

  if (result.selectedOccurrence) {
    const foundPath = result.selectedOccurrence.path;
    ast.traverseAST(code, {
      enter(path) {
        if (path.type !== foundPath.type) return;
        if (!ast.isSelectableNode(path.node)) return;
        if (!ast.isSelectableNode(foundPath.node)) return;

        const pathSelection = Selection.fromAST(path.node.loc);
        const foundPathSelection = Selection.fromAST(foundPath.node.loc);
        if (pathSelection.isEqualTo(foundPathSelection)) return;

        // TODO: extract as "areEqual(pathA, pathB)" in AST
        if (
          ast.isStringLiteral(path.node) &&
          ast.isStringLiteral(foundPath.node) &&
          path.node.value === foundPath.node.value
        ) {
          result.otherOccurrencesLocs.push(path.node.loc);
        }
      }
    });
  }

  return result;
}

function findObjectPropertyLoc(
  selection: Selection,
  node: ast.SelectableObjectProperty
): ast.SourceLocation | null {
  if (selection.isInsideNode(node.value)) return node.value.loc;
  if (node.computed) return node.key.loc;

  // Non-computed properties can't be extracted.
  // It will extract the whole object instead.
  return null;
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

function isExtractable(path: ast.NodePath): boolean {
  return (
    !ast.isPartOfMemberExpression(path) &&
    !ast.isClassPropertyIdentifier(path) &&
    !ast.isVariableDeclarationIdentifier(path) &&
    !ast.isFunctionCallIdentifier(path) &&
    !ast.isJSXPartialElement(path) &&
    !ast.isTemplateElement(path) &&
    !ast.isBlockStatement(path) &&
    !ast.isSpreadElement(path) &&
    // Don't extract object method because we don't handle `this`.
    !ast.isObjectMethod(path)
  );
}

type ExtractableCode = {
  selectedOccurrence: Occurrence | null;
  otherOccurrencesLocs: ast.SourceLocation[];
  parseId: (id: Code) => Code;
  parseCode: (code: Code) => Code;
};

type Occurrence = {
  path: ast.NodePath;
  loc: ast.SourceLocation;
};
