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

      path.replaceWith(createTemplateLiteral([leftValue, rightValue]));
    },

    StringLiteral(path) {
      if (!selection.isInsidePath(path)) return;

      path.replaceWith(createTemplateLiteral([path.node.value]));
    }
  });
}

function getValue(
  node: ast.BinaryExpression["left"]
): string | number | boolean | null {
  if ("value" in node) {
    return node.value;
  }

  if (ast.isNullLiteral(node)) {
    return "null";
  }

  if (ast.isUndefinedLiteral(node)) {
    return "undefined";
  }

  return null;
}

function createTemplateLiteral(
  values: (string | number | boolean)[]
): ast.TemplateLiteral {
  return ast.templateLiteral(values.map(ast.templateElement), []);
}
