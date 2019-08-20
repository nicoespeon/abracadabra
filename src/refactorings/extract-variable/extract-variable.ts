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

  const extractedOccurrences =
    choice === ReplaceChoice.AllOccurrences
      ? [selectedOccurrence].concat(otherOccurrences)
      : [selectedOccurrence];
  const topMostOccurrence = extractedOccurrences.sort(topToBottom)[0];

  await editor.readThenWrite(
    selectedOccurrence.selection,
    extractedCode => [
      // Insert new variable declaration.
      {
        code: selectedOccurrence.toVariableDeclaration(extractedCode),
        selection: topMostOccurrence.getScopeParentCursor()
      },
      // Replace extracted code with new variable.
      ...extractedOccurrences.map(occurrence => ({
        code: occurrence.toVariableId(),
        selection: occurrence.selection
      }))
    ],
    selectedOccurrence.positionOnExtractedId()
  );

  // Extracted symbol is located at `selection` => just trigger a rename.
  await renameSymbol(editor);
}

function topToBottom(a: Occurrence, b: Occurrence): number {
  return a.selection.startsBefore(b.selection) ? -1 : 1;
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

  if (result.selectedOccurrence) {
    result.otherOccurrences = findOtherOccurrences(
      result.selectedOccurrence,
      code
    );
  }

  return result;
}

function findOtherOccurrences(
  occurrence: Occurrence,
  code: string
): Occurrence[] {
  let result: Occurrence[] = [];

  const visitor = {
    enter(path: ast.NodePath) {
      const { node } = path;

      if (path.type !== occurrence.path.type) return;
      if (!ast.isSelectableNode(node)) return;
      if (!ast.isSelectableNode(occurrence.path.node)) return;

      const pathSelection = Selection.fromAST(node.loc);
      if (pathSelection.isEqualTo(occurrence.selection)) return;

      // TODO: extract as "areEqual(pathA, pathB)" in AST
      if (
        ast.isStringLiteral(path.node) &&
        ast.isStringLiteral(occurrence.path.node) &&
        path.node.value === occurrence.path.node.value
      ) {
        result.push(new Occurrence(path, node.loc));
      }
    }
  };

  const scopePath = occurrence.path.getFunctionParent();
  scopePath ? scopePath.traverse(visitor) : ast.traverseAST(code, visitor);

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
  private variableName = "extracted";

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

  positionOnExtractedId(): Position {
    return new Position(
      this.selection.start.line + this.selection.height + 1,
      this.selection.start.character + this.variableName.length
    );
  }

  getScopeParentCursor(): Selection {
    const position = this.getScopeParentPosition();
    return Selection.fromPositions(position, position);
  }

  toVariableDeclaration(code: Code): Code {
    const extractedCode = ast.isJSXText(this.path.node) ? `"${code}"` : code;
    return `const ${this.variableName} = ${extractedCode};\n${
      this.indentation
    }`;
  }

  toVariableId(): Code {
    const shouldWrapInBraces =
      (ast.isJSXElement(this.path.node) || ast.isJSXText(this.path.node)) &&
      ast.isJSX(this.path.parent);

    return shouldWrapInBraces ? `{${this.variableName}}` : this.variableName;
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
