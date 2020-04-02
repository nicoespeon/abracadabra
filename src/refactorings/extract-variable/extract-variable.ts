import { camel } from "change-case";

import { Editor, Code, ErrorReason, Modification } from "../../editor/editor";
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

  ast.parseAndTraverseCode(code, {
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

function findOtherOccurrences(
  occurrence: Occurrence,
  code: string,
  selection: Selection
): Occurrence[] {
  let result: Occurrence[] = [];

  const visitor = {
    enter(path: ast.NodePath) {
      const { node } = path;

      if (path.type !== occurrence.path.type) return;
      if (!ast.isSelectableNode(node)) return;
      if (!ast.isSelectableNode(occurrence.path.node)) return;

      const loc = getOccurrenceLoc(node, selection);
      if (!loc) return;

      const pathSelection = Selection.fromAST(loc);
      if (pathSelection.isEqualTo(occurrence.selection)) return;

      if (ast.areEqual(path.node, occurrence.path.node)) {
        result.push(createOccurrence(path, node.loc));
      }
    }
  };

  const scopePath = occurrence.path.getFunctionParent();
  scopePath
    ? scopePath.traverse(visitor)
    : ast.parseAndTraverseCode(code, visitor);

  return result;
}

function getOccurrenceLoc(
  node: ast.SelectableNode,
  selection: Selection
): ast.SourceLocation | null {
  return ast.isSelectableObjectProperty(node)
    ? findObjectPropertyLoc(selection, node)
    : ast.isJSXExpressionContainer(node)
    ? node.expression.loc
    : node.loc;
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
    ast.isSwitchCase(node) ||
    ast.isJSXExpressionContainer(node) ||
    ast.isJSXAttribute(node) ||
    ast.isSpreadElement(node)
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
    !ast.isTSTypeAnnotation(path) &&
    // Don't extract object method because we don't handle `this`.
    !ast.isObjectMethod(path)
  );
}

type ExtractableCode = {
  selectedOccurrence: Occurrence | null;
  otherOccurrences: Occurrence[];
};

function createOccurrence(
  path: ast.NodePath,
  loc: ast.SourceLocation
): Occurrence {
  if (ast.canBeShorthand(path)) {
    return new ShorthandOccurrence(path, loc);
  }

  if (path.isMemberExpression()) {
    return new MemberExpressionOccurrence(path, loc);
  }

  return new Occurrence(path, loc);
}

class Occurrence {
  path: ast.NodePath;
  loc: ast.SourceLocation;

  protected variable: Variable;

  constructor(path: ast.NodePath, loc: ast.SourceLocation) {
    this.path = path;
    this.loc = loc;
    this.variable = new Variable(path);
  }

  get selection() {
    return Selection.fromAST(this.loc);
  }

  get indentation(): Code {
    return this.indentationChar.repeat(this.indentationLevel);
  }

  get modification(): Modification {
    return {
      code: this.variable.id,
      selection: this.selection
    };
  }

  get positionOnExtractedId(): Position {
    return new Position(
      this.selection.start.line + this.selection.height + 1,
      this.selection.start.character + this.variable.length
    );
  }

  get scopeParentCursor(): Selection {
    const position = this.getScopeParentPosition();
    return Selection.fromPositions(position, position);
  }

  toVariableDeclaration(code: Code): Code {
    const extractedCode = ast.isJSXText(this.path.node) ? `"${code}"` : code;
    const { name } = this.variable;

    return `const ${name} = ${extractedCode};\n${this.indentation}`;
  }

  private get indentationChar(): string {
    try {
      // @ts-ignore It's not typed, but it seems recast adds info at runtime.
      const { line: sourceCodeChars } = this.path.node.loc.lines.infos[
        this.loc.start.line - 1
      ];

      return sourceCodeChars[0];
    } catch (_) {
      // If it fails at runtime, fallback on a space.
      return " ";
    }
  }

  private get indentationLevel(): IndentationLevel {
    return this.getScopeParentPosition().character;
  }

  private getScopeParentPosition(): Position {
    const parentPath = ast.findScopePath(this.path);
    const parent = parentPath ? parentPath.node : this.path.node;
    if (!parent.loc) return this.selection.start;

    return Position.fromAST(parent.loc.start);
  }
}

class ShorthandOccurrence extends Occurrence {
  private keySelection: Selection;

  constructor(path: ast.NodePath<ast.ObjectProperty>, loc: ast.SourceLocation) {
    super(path, loc);
    this.keySelection = Selection.fromAST(path.node.key.loc);
  }

  get modification(): Modification {
    return {
      code: "",
      selection: this.selection.extendStartToEndOf(this.keySelection)
    };
  }

  get positionOnExtractedId(): Position {
    return new Position(
      this.selection.start.line + this.selection.height + 1,
      this.keySelection.end.character
    );
  }
}

class MemberExpressionOccurrence extends Occurrence {
  path: ast.NodePath<ast.MemberExpression>;

  constructor(
    path: ast.NodePath<ast.MemberExpression>,
    loc: ast.SourceLocation
  ) {
    super(path, loc);
    this.path = path;
  }

  toVariableDeclaration(code: Code): Code {
    if (this.path.node.computed) {
      return super.toVariableDeclaration(code);
    }

    const extractedCode = ast.generate(this.path.node.object);
    const name = `{ ${this.variable.name} }`;

    return `const ${name} = ${extractedCode};\n${this.indentation}`;
  }
}

class Variable {
  private _name = "extracted";
  private path: ast.NodePath;

  constructor(path: ast.NodePath) {
    this.path = path;

    const { node } = path;

    if (ast.isStringLiteral(node)) {
      this.tryToSetNameWith(camel(node.value));
    }

    if (ast.canBeShorthand(path)) {
      this.tryToSetNameWith2(path.node.key.name);
    }

    if (ast.isMemberExpression(node)) {
      if (ast.isIdentifier(node.property) && !node.computed) {
        this.tryToSetNameWith(node.property.name);
      }
    }
  }

  get name(): string {
    return this._name;
  }

  get length(): number {
    return this._name.length;
  }

  get id(): Code {
    const { parent, node } = this.path;

    const shouldWrapInBraces =
      ast.isJSXAttribute(parent) ||
      (ast.isJSX(parent) && (ast.isJSXElement(node) || ast.isJSXText(node)));

    return shouldWrapInBraces ? `{${this.name}}` : this.name;
  }

  private tryToSetNameWith(value: string) {
    const startsWithNumber = value.match(/^\d.*/);

    const BLACKLISTED_KEYWORDS = [
      "const",
      "var",
      "let",
      "function",
      "if",
      "else",
      "switch",
      "case",
      "default",
      "import",
      "export"
    ];

    if (
      value.length > 1 &&
      value.length <= 20 &&
      !startsWithNumber &&
      !BLACKLISTED_KEYWORDS.includes(value)
    ) {
      this._name = value;
    }
  }

  private tryToSetNameWith2(value: string) {
    const startsWithNumber = value.match(/^\d.*/);

    const BLACKLISTED_KEYWORDS = [
      "const",
      "var",
      "let",
      "function",
      "if",
      "else",
      "switch",
      "case",
      "default",
      "import",
      "export"
    ];

    if (!startsWithNumber && !BLACKLISTED_KEYWORDS.includes(value)) {
      this._name = value;
    }
  }
}

type IndentationLevel = number;
