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

function createOccurrence(path: t.NodePath, loc: t.SourceLocation): Occurrence {
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
  private keySelection: Selection;

  constructor(
    path: t.NodePath<t.ObjectProperty>,
    loc: t.SourceLocation,
    variable: Variable
  ) {
    super(path, loc, variable);
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

type IndentationLevel = number;
