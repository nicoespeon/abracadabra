import { Code, Write } from "../../editor/i-write-code";
import { Selection } from "../../editor/selection";
import {
  ShowErrorMessage,
  ErrorReason
} from "../../editor/i-show-error-message";
import * as ast from "../../ast";

export { convertToTemplateLiteral, canConvertToTemplateLiteral };

async function convertToTemplateLiteral(
  code: Code,
  selection: Selection,
  write: Write,
  showErrorMessage: ShowErrorMessage
) {
  const updatedCode = updateCode(code, selection);

  if (!updatedCode.hasCodeChanged) {
    showErrorMessage(ErrorReason.DidNotFoundStringToConvert);
    return;
  }

  await write(updatedCode.code);
}

function canConvertToTemplateLiteral(
  code: Code,
  selection: Selection
): boolean {
  return updateCode(code, selection).hasCodeChanged;
}

function updateCode(code: Code, selection: Selection): ast.Transformed {
  return ast.transform(code, {
    BinaryExpression(path) {
      if (!selection.isInsidePath(path)) return;

      const { left, right } = path.node;
      if (!ast.isStringLiteral(left) && !ast.isStringLiteral(right)) return;

      const leftValue = getValue(left);
      if (!leftValue) return;

      const rightValue = getValue(right);
      if (!rightValue) return;

      const templateLiteral = createTemplateLiteral([leftValue, rightValue]);
      path.replaceWith(templateLiteral);
    },

    StringLiteral(path) {
      if (!selection.isInsidePath(path)) return;

      const templateLiteral = createTemplateLiteral([
        new ElementValue(path.node)
      ]);
      path.replaceWith(templateLiteral);
    }
  });
}

function getValue(node: ast.BinaryExpression["left"]): Value | null {
  if ("value" in node) return new ElementValue(node);
  if (ast.isNullLiteral(node)) return new NullValue();
  if (ast.isUndefinedLiteral(node)) return new UndefinedValue();
  if (ast.isIdentifier(node)) return new IdentifierValue(node);

  return null;
}

function createTemplateLiteral(values: Value[]): ast.TemplateLiteral {
  const quasis = values.map(value => ast.templateElement(value.element));
  const expressions = values
    .map(value => value.expression)
    .filter((expression): expression is ast.Identifier => expression !== null);

  return ast.templateLiteral(quasis, expressions);
}

interface Value {
  element: string | number | boolean;
  expression: ast.Identifier | null;
}

class ElementValue implements Value {
  element: string | number | boolean;
  expression = null;

  constructor(
    node:
      | ast.StringLiteral
      | ast.NumberLiteral
      | ast.BooleanLiteral
      | ast.BigIntLiteral
  ) {
    this.element = node.value;
  }
}

class NullValue implements Value {
  element = "null";
  expression = null;
}

class UndefinedValue implements Value {
  element = "undefined";
  expression = null;
}

class IdentifierValue implements Value {
  element = "";
  expression: ast.Identifier;

  constructor(node: ast.Identifier) {
    this.expression = node;
  }
}
