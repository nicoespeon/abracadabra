import * as t from "../../../ast";
import { Code, Editor, ErrorReason } from "../../../editor/editor";
import { Selection } from "../../../editor/selection";
import { renameSymbol } from "../../rename-symbol/rename-symbol";
import {
  askReplacementStrategy,
  ReplacementStrategy
} from "../replacement-strategy";
import { createOccurrence, Occurrence } from "./occurrence";

export async function extractVariable(editor: Editor) {
  const { code, selection } = editor;
  const { selected: selectedOccurrence, others: otherOccurrences } =
    findAllOccurrences(code, selection);

  if (!selectedOccurrence) {
    editor.showError(ErrorReason.DidNotFindExtractableCode);
    return;
  }

  const replacementStrategy = await askReplacementStrategy(
    otherOccurrences,
    editor
  );
  if (replacementStrategy === ReplacementStrategy.None) return;

  const extractedOccurrences =
    replacementStrategy === ReplacementStrategy.AllOccurrences
      ? [selectedOccurrence].concat(otherOccurrences)
      : [selectedOccurrence];

  await selectedOccurrence.askModificationDetails(editor);

  await editor.readThenWrite(
    selectedOccurrence.selection,
    (extractedCode) => [
      selectedOccurrence.toVariableDeclaration(
        extractedCode,
        extractedOccurrences
      ),
      // Replace extracted code with new variable.
      ...extractedOccurrences.map((occurrence) => occurrence.modification)
    ],
    selectedOccurrence.cursorOnIdentifier(extractedOccurrences)
  );

  // Extracted symbol is located at `selection` => just trigger a rename.
  await renameSymbol(editor);
}

function findAllOccurrences(code: Code, selection: Selection): AllOccurrences {
  const result: AllOccurrences = {
    selected: null,
    others: []
  };

  t.parseAndTraverseCode(code, {
    enter(path) {
      // Export default declaration missing loc workaround.
      if (path.parentPath && path.parentPath.isExportDefaultDeclaration()) {
        path.node.loc = t.getExportDefaultDeclarationLoc(path.parentPath);
      }

      if (!selection.isInsidePath(path)) return;

      if (path.isReturnStatement()) {
        const argumentPath = path.get("argument");
        if (Array.isArray(argumentPath)) return;
        if (argumentPath.node === null) return;

        // Expand selection to `return`, but extract the returned value.
        path = argumentPath;
      }

      if (!t.isSelectablePath(path)) return;
      if (!isExtractableContext(path.parent)) return;
      if (!isExtractable(path)) return;
      if (isClassIdentifier(path)) return;

      const loc = getOccurrenceLoc(path.node, selection);
      if (!loc) return;

      result.selected = createOccurrence(path, loc, selection);
    }
  });

  if (result.selected) {
    result.others = findOtherOccurrences(result.selected, code, selection);
  }

  return result;
}

type AllOccurrences = {
  selected: Occurrence | null;
  others: Occurrence[];
};

function isClassIdentifier(path: t.NodePath<t.Node>): boolean {
  return path.isIdentifier() && path.parentPath.isNewExpression();
}

function findOtherOccurrences(
  occurrence: Occurrence,
  code: string,
  selection: Selection
): Occurrence[] {
  const result: Occurrence[] = [];

  const visitor = {
    enter(path: t.NodePath) {
      const { node, parentPath } = path;

      if (!parentPath) return;
      if (path.type !== occurrence.path.type) return;
      if (!t.isSelectableNode(node)) return;
      if (!t.isSelectableNode(occurrence.path.node)) return;
      if (
        parentPath.isAssignmentExpression() &&
        parentPath.node.left === node
      ) {
        return;
      }

      const loc = getOccurrenceLoc(node, selection);
      if (!loc) return;

      const pathSelection = Selection.fromAST(loc);
      if (pathSelection.isEqualTo(occurrence.selection)) return;

      if (t.areEquivalent(path.node, occurrence.path.node)) {
        result.push(createOccurrence(path, node.loc, selection));
      }
    }
  };

  const scopePath = occurrence.path.getFunctionParent();
  if (scopePath) scopePath.traverse(visitor);
  else t.parseAndTraverseCode(code, visitor);

  return result;
}

function getOccurrenceLoc(
  node: t.SelectableNode,
  selection: Selection
): t.SourceLocation | null {
  const result = t.isSelectableObjectProperty(node)
    ? findObjectPropertyLoc(selection, node)
    : t.isJSXExpressionContainer(node)
    ? node.expression.loc
    : node.loc;
  return result ?? null;
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
    t.isSpreadElement(node) ||
    t.isThrowStatement(node) ||
    t.isExportDeclaration(node) ||
    t.isForOfStatement(node)
  );
}

function isExtractable(path: t.NodePath): boolean {
  return (
    !t.isPropertyOfMemberExpression(path) &&
    !t.isClassPropertyIdentifier(path) &&
    !t.isVariableDeclarationIdentifier(path) &&
    !t.isFunctionCallIdentifier(path) &&
    !t.isJSXPartialElement(path) &&
    !t.isTemplateElement(path) &&
    !t.isBlockStatement(path) &&
    !t.isSpreadElement(path) &&
    !t.isTSTypeAnnotation(path) &&
    !t.isJSXIdentifier(path) &&
    !t.isTSTypeParameterInstantiation(path) &&
    // Don't extract object method because we don't handle `this`.
    !t.isObjectMethod(path)
  );
}
