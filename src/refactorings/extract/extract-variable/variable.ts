import { camelCase } from "change-case";

import { Code } from "../../../editor/editor";
import * as t from "../../../ast";

export {
  Variable,
  StringLiteralVariable,
  MemberExpressionVariable,
  ShorthandVariable
};

class Variable {
  protected _name = "extracted";

  constructor(protected node: t.Node, private parent: t.Node) {}

  get name(): string {
    return this._name;
  }

  get length(): number {
    return this._name.length;
  }

  get id(): Code {
    const shouldWrapInBraces =
      t.isJSXAttribute(this.parent) ||
      (t.isJSX(this.parent) &&
        (t.isJSXElement(this.node) || t.isJSXText(this.node)));

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

class StringLiteralVariable extends Variable {
  constructor(protected node: t.StringLiteral, parent: t.Node) {
    super(node, parent);
    this.tryToSetNameWith(camelCase(node.value));
  }

  protected isValidName(value: string): boolean {
    return super.isValidName(value) && value.length > 1 && value.length <= 20;
  }
}

class MemberExpressionVariable extends Variable {
  constructor(protected node: t.MemberExpression, parent: t.Node) {
    super(node, parent);
    const { property, computed } = node;

    if (t.isIdentifier(property) && !computed) {
      this.tryToSetNameWith(property.name);
    }
  }
}

class ShorthandVariable extends Variable {
  constructor(protected node: t.ObjectProperty, parent: t.Node) {
    super(node, parent);
    this.tryToSetNameWith(node.key.name);
  }

  get isValid(): boolean {
    return this.isValidName(this.node.key.name);
  }
}
