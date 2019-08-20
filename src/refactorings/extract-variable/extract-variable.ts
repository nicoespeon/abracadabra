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
  const { selectedOccurrence, otherOccurrences } = findExtractableCode(
    code,
    selection
  );

  if (!selectedOccurrence) {
    editor.showError(ErrorReason.DidNotFoundExtractableCode);
    return;
  }

  const choice = await getChoice(otherOccurrences, editor);
  if (choice === ReplaceChoice.None) return;

  const variableName = "extracted";
  const extractedSelection = selectedOccurrence.selection;

  const cursorOnExtractedId = new Position(
    extractedSelection.start.line + extractedSelection.height + 1,
    extractedSelection.start.character + variableName.length
  );

  const occurrencesSelections =
    choice === ReplaceChoice.AllOccurrences
      ? [extractedSelection].concat(
          otherOccurrences.map(({ selection }) => selection)
        )
      : [extractedSelection];

  await editor.readThenWrite(
    extractedSelection,
    extractedCode => [
      // Insert new variable declaration.
      {
        code: selectedOccurrence.toVariableDeclaration(extractedCode),
        selection: selectedOccurrence.getScopeParentCursor()
      },
      // Replace extracted code with new variable.
      ...occurrencesSelections.map(selection => ({
        code: selectedOccurrence.toVariableId(variableName),
        selection
      }))
    ],
    cursorOnExtractedId
  );

  // Extracted symbol is located at `selection` => just trigger a rename.
  await renameSymbol(editor);
}

async function getChoice(
  otherOccurrences: Occurrence[],
  editor: Editor
): Promise<ReplaceChoice> {
  const occurrencesCount = otherOccurrences.length;
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
    otherOccurrences: []
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

      result.selectedOccurrence = new Occurrence(path, loc);
    }
  });

  const found = result.selectedOccurrence;
  if (found) {
    ast.traverseAST(code, {
      enter(path) {
        if (path.type !== found.path.type) return;
        if (!ast.isSelectableNode(path.node)) return;
        if (!ast.isSelectableNode(found.path.node)) return;

        const pathSelection = Selection.fromAST(path.node.loc);
        if (pathSelection.isEqualTo(found.selection)) return;

        // TODO: extract as "areEqual(pathA, pathB)" in AST
        if (
          ast.isStringLiteral(path.node) &&
          ast.isStringLiteral(found.path.node) &&
          path.node.value === found.path.node.value
        ) {
          result.otherOccurrences.push(new Occurrence(path, path.node.loc));
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
  otherOccurrences: Occurrence[];
};

class Occurrence {
  path: ast.NodePath;
  loc: ast.SourceLocation;

  constructor(path: ast.NodePath, loc: ast.SourceLocation) {
    this.path = path;
    this.loc = loc;
  }

  get selection() {
    return Selection.fromAST(this.loc);
  }

  get indentation(): Code {
    return " ".repeat(this.getIndentationLevel());
  }

  getScopeParentCursor(): Selection {
    const position = this.getScopeParentPosition();
    return Selection.fromPositions(position, position);
  }

  toVariableDeclaration(code: Code): Code {
    const extractedCode = ast.isJSXText(this.path.node) ? `"${code}"` : code;
    return `const extracted = ${extractedCode};\n${this.indentation}`;
  }

  toVariableId(id: Code): Code {
    const shouldWrapInBraces =
      (ast.isJSXElement(this.path.node) || ast.isJSXText(this.path.node)) &&
      ast.isJSX(this.path.parent);

    return shouldWrapInBraces ? `{${id}}` : id;
  }

  private getIndentationLevel(): IndentationLevel {
    return this.getScopeParentPosition().character;
  }

  private getScopeParentPosition(): Position {
    const parentPath = ast.findScopePath(this.path);
    const parent = parentPath ? parentPath.node : this.path.node;
    if (!parent.loc) return this.selection.start;

    return Position.fromAST(parent.loc.start);
  }
}

type IndentationLevel = number;
