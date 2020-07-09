import {
  Editor,
  Code,
  ErrorReason,
  Modification
} from "../../../editor/editor";
import { Selection } from "../../../editor/selection";
import * as t from "../../../ast";

import { renameSymbol } from "../../rename-symbol/rename-symbol";
import { createOccurrence, Occurrence } from "./occurrence";
import {
  ReplacementStrategy,
  askReplacementStrategy
} from "../replacement-strategy";
import { Position } from "../../../editor/position";

export { extractVariable };

async function extractVariable(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const {
    selected: selectedOccurrence,
    others: otherOccurrences
  } = findAllOccurrences(code, selection);

  if (!selectedOccurrence) {
    editor.showError(ErrorReason.DidNotFindExtractableCode);
    return;
  }

  const choice = await askReplacementStrategy(otherOccurrences, editor);
  if (choice === ReplacementStrategy.None) return;

  const extractedOccurrences =
    choice === ReplacementStrategy.AllOccurrences
      ? [selectedOccurrence].concat(otherOccurrences)
      : [selectedOccurrence];

  await editor.readThenWrite(
    selectedOccurrence.selection,
    (extractedCode) => [
      new VariableDeclarationModification(
        extractedCode,
        selectedOccurrence,
        extractedOccurrences
      ),
      // Replace extracted code with new variable.
      ...extractedOccurrences.map((occurrence) => occurrence.modification)
    ],
    selectedOccurrence.positionOnExtractedId
  );

  // Extracted symbol is located at `selection` => just trigger a rename.
  await renameSymbol(editor);
}

class VariableDeclarationModification implements Modification {
  constructor(
    private value: Code,
    private selectedOccurrence: Occurrence,
    private allOccurrences: Occurrence[]
  ) {}

  get code(): Code {
    const { name, value } = this.selectedOccurrence.toVariableDeclaration(
      this.value
    );
    const indentation = this.indentationChar.repeat(this.indentationLevel);

    return `const ${name} = ${value};\n${indentation}`;
  }

  get selection(): Selection {
    const topMostOccurrence = this.allOccurrences.sort(topToBottom)[0];
    return topMostOccurrence.cursorOnCommonAncestor(this.allOccurrences);
  }

  private get indentationChar(): string {
    try {
      const {
        line: sourceCodeChars
        // @ts-ignore It's not typed, but it seems recast adds info at runtime.
      } = this.selectedOccurrence.path.node.loc.lines.infos[
        this.selectedOccurrence.loc.start.line - 1
      ];

      return sourceCodeChars[0];
    } catch (_) {
      // If it fails at runtime, fallback on a space.
      return " ";
    }
  }

  private get indentationLevel(): IndentationLevel {
    return this.getParentScopePosition().character;
  }

  private getParentScopePosition(): Position {
    const parentPath = t.findScopePath(this.selectedOccurrence.path);
    const parent = parentPath
      ? parentPath.node
      : this.selectedOccurrence.path.node;
    if (!parent.loc) return this.selection.start;

    return Position.fromAST(parent.loc.start);
  }
}

type IndentationLevel = number;

function topToBottom(a: Occurrence, b: Occurrence): number {
  return a.selection.startsBefore(b.selection) ? -1 : 1;
}

function findAllOccurrences(code: Code, selection: Selection): AllOccurrences {
  let result: AllOccurrences = {
    selected: null,
    others: []
  };

  t.parseAndTraverseCode(code, {
    enter(path) {
      if (!selection.isInsidePath(path)) return;

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

      if (t.areEquivalent(path.node, occurrence.path.node)) {
        result.push(createOccurrence(path, node.loc, selection));
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
    t.isSpreadElement(node) ||
    t.isThrowStatement(node)
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
