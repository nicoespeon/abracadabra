import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

import { renameSymbol } from "../rename-symbol/rename-symbol";
import { createOccurrence, Occurrence } from "./occurrence";

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
    editor.showError(ErrorReason.DidNotFindExtractableCode);
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
        selection: topMostOccurrence.scopeParentCursor
      },
      // Replace extracted code with new variable.
      ...extractedOccurrences.map(occurrence => occurrence.modification)
    ],
    selectedOccurrence.positionOnExtractedId
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

  t.parseAndTraverseCode(code, {
    enter(path) {
      if (!isExtractableContext(path.parent)) return;
      if (!isExtractable(path)) return;

      const { node } = path;
      if (!selection.isInsideNode(node)) return;

      const loc = getOccurrenceLoc(node, selection);
      if (!loc) return;

      result.selectedOccurrence = createOccurrence(path, loc);
    }
  });

  if (result.selectedOccurrence) {
    result.otherOccurrences = findOtherOccurrences(
      result.selectedOccurrence,
      code,
      selection
    );
  }

  return result;
}

type ExtractableCode = {
  selectedOccurrence: Occurrence | null;
  otherOccurrences: Occurrence[];
};

function findOtherOccurrences(
  occurrence: Occurrence,
  code: string,
  selection: Selection
): Occurrence[] {
  let result: Occurrence[] = [];

  const visitor = {
    enter(path: t.NodePath) {
      const { node } = path;

      if (path.type !== occurrence.path.type) return;
      if (!t.isSelectableNode(node)) return;
      if (!t.isSelectableNode(occurrence.path.node)) return;

      const loc = getOccurrenceLoc(node, selection);
      if (!loc) return;

      const pathSelection = Selection.fromAST(loc);
      if (pathSelection.isEqualTo(occurrence.selection)) return;

      if (t.areEqual(path.node, occurrence.path.node)) {
        result.push(createOccurrence(path, node.loc));
      }
    }
  };

  const scopePath = occurrence.path.getFunctionParent();
  scopePath
    ? scopePath.traverse(visitor)
    : t.parseAndTraverseCode(code, visitor);

  return result;
}

function getOccurrenceLoc(
  node: t.SelectableNode,
  selection: Selection
): t.SourceLocation | null {
  return t.isSelectableObjectProperty(node)
    ? findObjectPropertyLoc(selection, node)
    : t.isJSXExpressionContainer(node)
    ? node.expression.loc
    : node.loc;
}

function findObjectPropertyLoc(
  selection: Selection,
  node: t.SelectableObjectProperty
): t.SourceLocation | null {
  if (selection.isInsideNode(node.value)) return node.value.loc;
  if (node.computed) return node.key.loc;

  // Non-computed properties can't be extracted.
  // It will extract the whole object instead.
  return null;
}

function isExtractableContext(node: t.Node): boolean {
  return (
    (t.isExpression(node) && !t.isArrowFunctionExpression(node)) ||
    t.isReturnStatement(node) ||
    t.isVariableDeclarator(node) ||
    t.isClassProperty(node) ||
    t.isIfStatement(node) ||
    t.isWhileStatement(node) ||
    t.isSwitchCase(node) ||
    t.isJSXExpressionContainer(node) ||
    t.isJSXAttribute(node) ||
    t.isSpreadElement(node)
  );
}

function isExtractable(path: t.NodePath): boolean {
  return (
    !t.isPartOfMemberExpression(path) &&
    !t.isClassPropertyIdentifier(path) &&
    !t.isVariableDeclarationIdentifier(path) &&
    !t.isFunctionCallIdentifier(path) &&
    !t.isJSXPartialElement(path) &&
    !t.isTemplateElement(path) &&
    !t.isBlockStatement(path) &&
    !t.isSpreadElement(path) &&
    !t.isTSTypeAnnotation(path) &&
    // Don't extract object method because we don't handle `this`.
    !t.isObjectMethod(path)
  );
}
