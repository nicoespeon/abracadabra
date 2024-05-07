import { Code } from "../../../editor/editor";
import * as t from "../../../ast";
import { camelCase } from "./changeCase";

export class Variable<T = t.Node> {
  protected _name: string;

  constructor(protected path: t.NodePath<T>) {
    this._name = this.initName();
  }

  private initName(): string {
    let name = "extracted";

    const bindingNamesInScope = t.bindingNamesInScope(this.path);
    let i = 1;
    while (bindingNamesInScope.includes(name)) {
      name = `extracted${i}`;
      i++;
    }

    return name;
  }

  get name(): string {
    return this._name;
  }

  get length(): number {
    return this._name.length;
  }

  get id(): Code {
    const shouldWrapInBraces =
      this.path.parentPath?.isJSXAttribute() ||
      (this.path.parentPath?.isJSX() &&
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

    return (
      !startsWithNumber &&
      !BLACKLISTED_KEYWORDS.includes(value) &&
      !t.bindingNamesInScope(this.path).includes(value)
    );
  }
}

export class StringLiteralVariable extends Variable<t.Node> {
  constructor(path: t.NodePath<t.Node>, proposedName: string) {
    super(path);
    this.tryToSetNameWith(camelCase(proposedName));
  }

  protected isValidName(value: string): boolean {
    return super.isValidName(value) && value.length > 1 && value.length <= 20;
  }
}

export class NewExpressionVariable extends Variable<t.NewExpression> {
  constructor(path: t.NodePath<t.NewExpression>) {
    super(path);
    if (path.node.callee.type === "Identifier") {
      this.tryToSetNameWith(camelCase(path.node.callee.name));
    }
  }
}

export class MemberExpressionVariable extends Variable<
  t.MemberExpression | t.OptionalMemberExpression
> {
  constructor(
    path: t.NodePath<t.MemberExpression | t.OptionalMemberExpression>
  ) {
    super(path);
    const { property, computed } = path.node;

    if (t.isIdentifier(property) && !computed) {
      this.tryToSetNameWith(property.name);
    }
  }
}

export class ShorthandVariable extends Variable<t.ObjectProperty> {
  constructor(path: t.NodePath<t.ObjectProperty>) {
    super(path);
    if ("name" in path.node.key) {
      this.tryToSetNameWith(path.node.key.name);
    }
  }

  get isValid(): boolean {
    if (!("name" in this.path.node.key)) return true;
    return this.isValidName(this.path.node.key.name);
  }
}
