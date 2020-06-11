import { Code, Modification } from "../../../editor/editor";
import { Selection } from "../../../editor/selection";
import { Position } from "../../../editor/position";
import * as t from "../../../ast";

import {
  Variable,
  StringLiteralVariable,
  MemberExpressionVariable,
  ShorthandVariable
} from "./variable";

export { createOccurrence, Occurrence };

function createOccurrence(
  path: t.NodePath,
  loc: t.SourceLocation,
  selection: Selection
): Occurrence {
  if (t.canBeShorthand(path)) {
    const variable = new ShorthandVariable(path.node, path.parent);

    if (variable.isValid) {
      return new ShorthandOccurrence(path, loc, variable);
    }
  }

  if (path.isMemberExpression()) {
    return new MemberExpressionOccurrence(
      path,
      loc,
      new MemberExpressionVariable(path.node, path.parent)
    );
  }

  if (path.isStringLiteral()) {
    return new Occurrence(
      path,
      loc,
      new StringLiteralVariable(path.node, path.parent)
    );
  }

  if (
    path.isTemplateLiteral() &&
    !selection.isEmpty() &&
    PartialTemplateLiteralOccurrence.isValid(path, loc, selection)
  ) {
    return new PartialTemplateLiteralOccurrence(path, loc, selection);
  }

  return new Occurrence(path, loc, new Variable(path.node, path.parent));
}

class Occurrence<T extends t.Node = t.Node> {
  constructor(
    public path: t.NodePath<T>,
    public loc: t.SourceLocation,
    protected variable: Variable
  ) {}

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
    const extractedCode = t.isJSXText(this.path.node) ? `"${code}"` : code;
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
    const parentPath = t.findScopePath(this.path);
    const parent = parentPath ? parentPath.node : this.path.node;
    if (!parent.loc) return this.selection.start;

    return Position.fromAST(parent.loc.start);
  }
}

class ShorthandOccurrence extends Occurrence<t.ObjectProperty> {
  private get keySelection(): Selection {
    return Selection.fromAST(this.path.node.key.loc);
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

class MemberExpressionOccurrence extends Occurrence<t.MemberExpression> {
  toVariableDeclaration(code: Code): Code {
    if (this.path.node.computed) {
      return super.toVariableDeclaration(code);
    }

    const extractedCode = t.generate(this.path.node.object);
    const name = `{ ${this.variable.name} }`;

    return `const ${name} = ${extractedCode};\n${this.indentation}`;
  }
}

class PartialTemplateLiteralOccurrence extends Occurrence<t.TemplateLiteral> {
  constructor(
    path: t.NodePath<t.TemplateLiteral>,
    loc: t.SourceLocation,
    private readonly userSelection: Selection
  ) {
    super(path, loc, new Variable(path.node, path.parent));

    // Override variable after `this` is set
    this.variable = new StringLiteralVariable(
      t.stringLiteral(this.parts.value),
      // We don't care about the parent since it's made up
      t.blockStatement([])
    );
  }

  static isValid(
    path: t.NodePath<t.TemplateLiteral>,
    loc: t.SourceLocation,
    userSelection: Selection
  ): boolean {
    try {
      const occurrence = new PartialTemplateLiteralOccurrence(
        path,
        loc,
        userSelection
      );

      // If any of these throws, Occurrence is invalid
      occurrence.toVariableDeclaration();
      occurrence.modification;
    } catch {
      return false;
    }

    return true;
  }

  toVariableDeclaration(): Code {
    return `const ${this.variable.name} = "${this.parts.value}";\n${
      this.indentation
    }`;
  }

  get modification(): Modification {
    const { left, right } = this.parts;
    const { quasis, expressions } = this.path.node;
    const { index } = this.selectedQuasi;

    const newQuasis = [t.templateElement(left), t.templateElement(right)];

    const newTemplateLiteral = t.templateLiteral(
      // Replace quasi with the new truncated ones
      [...quasis.slice(0, index), ...newQuasis, ...quasis.slice(index + 1)],
      // Insert the new expression
      [
        ...expressions.slice(0, index),
        t.identifier(this.variable.name),
        ...expressions.slice(index)
      ]
    );

    return {
      code: t.print(newTemplateLiteral),
      selection: this.selection
    };
  }

  private get parts(): {
    value: Code;
    left: string;
    right: string;
  } {
    const start = this.userSelection.start.character - this.offset;
    const end = this.userSelection.end.character - this.offset;

    const value = this.selectedQuasi.value.raw.slice(start, end);
    const left = this.selectedQuasi.value.raw.slice(0, start);
    const right = this.selectedQuasi.value.raw.slice(end);

    return { value, left, right };
  }

  private get selectedQuasi(): t.TemplateElement &
    t.SelectableNode & { index: number } {
    const index = this.path.node.quasis.findIndex(quasi =>
      this.userSelection.isInsideNode(quasi)
    );

    if (index < 0) {
      throw new Error("I can't find selected text in template elements");
    }

    const result = this.path.node.quasis[index];

    if (!t.isSelectableNode(result)) {
      throw new Error("Template element is not selectable");
    }

    return { ...result, index };
  }

  get positionOnExtractedId(): Position {
    // ${ is inserted before the Identifier
    const openingInterpolationLength = 2;

    return new Position(
      this.selection.start.line + this.selection.height + 1,
      this.userSelection.start.character + openingInterpolationLength
    );
  }

  private get offset(): number {
    return Selection.fromAST(this.selectedQuasi.loc).start.character;
  }
}

type IndentationLevel = number;
