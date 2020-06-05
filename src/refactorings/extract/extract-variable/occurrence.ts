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

  if (path.isTemplateLiteral() && !selection.isEmpty()) {
    return new PartialTemplateLiteralOccurrence(
      path,
      loc,
      new Variable(path.node, path.parent),
      selection
    );
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
    variable: Variable,
    private readonly userSelection: Selection
  ) {
    super(path, loc, variable);
  }

  toVariableDeclaration(): Code {
    const { name, value } = this.parts;
    return `const ${name} = "${value}";\n${this.indentation}`;
  }

  get modification(): Modification {
    const { name, left, right } = this.parts;

    const newTemplateLiteral = t.templateLiteral(
      [t.templateElement(left), t.templateElement(right)],
      [t.identifier(name)]
    );

    return {
      code: t.print(newTemplateLiteral),
      selection: this.selection
    };
  }

  private get parts(): {
    name: string;
    value: Code;
    left: string;
    right: string;
  } {
    const offset = Selection.fromAST(this.selectedQuasi.loc).start.character;
    const start = this.userSelection.start.character - offset;
    const end = this.userSelection.end.character - offset;

    const value = this.selectedQuasi.value.raw.slice(start, end);
    const name = new StringLiteralVariable(
      t.stringLiteral(value),
      // We don't care about the parent since it's made up
      t.blockStatement([])
    ).name;

    const left = this.selectedQuasi.value.raw.slice(0, start);
    const right = this.selectedQuasi.value.raw.slice(end);

    return { name, value, left, right };
  }

  private get selectedQuasi(): t.TemplateElement & t.SelectableNode {
    const firstQuasi = this.path.node.quasis[0];

    if (!t.isSelectableNode(firstQuasi)) {
      throw new Error("I can't find selected text in code structure");
    }

    return firstQuasi;
  }
}

type IndentationLevel = number;
