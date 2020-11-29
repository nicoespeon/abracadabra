import { camelCase } from "change-case";

import { Code } from "../../../editor/editor";
import * as t from "../../../ast";

export {
  Variable,
  StringLiteralVariable,
  MemberExpressionVariable,
  ShorthandVariable
};

class Variable<T = t.Node> {
  protected _name = "extracted";

  constructor(protected path: t.NodePath<T>) {}

  get name(): string {
    return this._name;
  }

  get length(): number {
    return this._name.length;
  }

  get id(): Code {
    const shouldWrapInBraces =
      this.path.parentPath.isJSXAttribute() ||
      (this.path.parentPath.isJSX() &&
        (this.path.isJSXElement() || this.path.isJSXText()));

    return shouldWrapInBraces ? `{${this.name}}` : this.name;
  }

  protected tryToSetNameWith(value: string) {
    if (this.isValidName(value)) {
      this._name = value;
    }
  }

  protected isValidName(value: string): boolean {
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
      "export",
      "return",
      "class",
      "enum",
      "for",
      "while"
    ];

    return !startsWithNumber && !BLACKLISTED_KEYWORDS.includes(value);
  }
}

class StringLiteralVariable extends Variable<t.Node> {
  constructor(path: t.NodePath<t.Node>, proposedName: string) {
    super(path);
    this.tryToSetNameWith(camelCase(proposedName));
  }

  protected isValidName(value: string): boolean {
    return super.isValidName(value) && value.length > 1 && value.length <= 20;
  }
}

class MemberExpressionVariable extends Variable<t.MemberExpression> {
  constructor(path: t.NodePath<t.MemberExpression>) {
    super(path);
    const { property, computed } = path.node;

    if (t.isIdentifier(property) && !computed) {
      this.tryToSetNameWith(property.name);
    }
  }
}

class ShorthandVariable extends Variable<t.ObjectProperty> {
  constructor(path: t.NodePath<t.ObjectProperty>) {
    super(path);
    this.tryToSetNameWith(path.node.key.name);
  }

  get isValid(): boolean {
    return this.isValidName(this.path.node.key.name);
  }
}
