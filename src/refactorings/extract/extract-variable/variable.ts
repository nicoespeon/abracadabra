import { camel } from "change-case";

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

  constructor(protected path: t.NodePath) {}

  get name(): string {
    return this._name;
  }

  get length(): number {
    return this._name.length;
  }

  get id(): Code {
    const { parent, node } = this.path;

    const shouldWrapInBraces =
      t.isJSXAttribute(parent) ||
      (t.isJSX(parent) && (t.isJSXElement(node) || t.isJSXText(node)));

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
      "export"
    ];

    return !startsWithNumber && !BLACKLISTED_KEYWORDS.includes(value);
  }
}

class StringLiteralVariable extends Variable {
  constructor(protected path: t.NodePath<t.StringLiteral>) {
    super(path);
    this.tryToSetNameWith(camel(path.node.value));
  }

  protected isValidName(value: string): boolean {
    return super.isValidName(value) && value.length > 1 && value.length <= 20;
  }
}

class MemberExpressionVariable extends Variable {
  constructor(protected path: t.NodePath<t.MemberExpression>) {
    super(path);
    const {
      node: { property, computed }
    } = path;

    if (t.isIdentifier(property) && !computed) {
      this.tryToSetNameWith(property.name);
    }
  }
}

class ShorthandVariable extends Variable {
  constructor(protected path: t.NodePath<t.ObjectProperty>) {
    super(path);
    this.tryToSetNameWith(path.node.key.name);
  }

  get isValid(): boolean {
    return this.isValidName(this.path.node.key.name);
  }
}
