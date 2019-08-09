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
      const templateLiteral = createTemplateLiteral(
        new CompositeTemplate(getTemplate(left), getTemplate(right))
      );
      path.replaceWith(templateLiteral);
      path.stop();
    },

    StringLiteral(path) {
      if (!selection.isInsidePath(path)) return;

      const templateLiteral = createTemplateLiteral(
        new PrimitiveTemplate(path.node)
      );
      path.replaceWith(templateLiteral);
      path.stop();
    }
  });
}

function getTemplate(node: ast.BinaryExpression["left"]): Template {
  if ("value" in node) return new PrimitiveTemplate(node);
  if (ast.isNullLiteral(node)) return new NullTemplate();
  if (ast.isUndefinedLiteral(node)) return new UndefinedTemplate();
  if (ast.isIdentifier(node)) return new IdentifierTemplate(node);

  return new NoneTemplate();
}

function createTemplateLiteral(template: Template): ast.TemplateLiteral {
  return ast.templateLiteral(template.quasis, template.expressions);
}

interface Template {
  quasis: ast.TemplateElement[];
  expressions: ast.Expression[];
}

class CompositeTemplate implements Template {
  private left: Template;
  private right: Template;

  constructor(left: Template, right: Template) {
    this.left = left;
    this.right = right;
  }

  get quasis() {
    return [...this.left.quasis, ...this.right.quasis];
  }

  get expressions() {
    return [...this.left.expressions, ...this.right.expressions];
  }
}

class NoneTemplate implements Template {
  quasis: ast.TemplateElement[] = [];
  expressions: ast.Expression[] = [];
}

class PrimitiveTemplate implements Template {
  quasis: ast.TemplateElement[];
  expressions: ast.Expression[] = [];

  constructor(
    node:
      | ast.StringLiteral
      | ast.NumberLiteral
      | ast.BooleanLiteral
      | ast.BigIntLiteral
  ) {
    this.quasis = [ast.templateElement(node.value)];
  }
}

class NullTemplate implements Template {
  quasis: ast.TemplateElement[] = [ast.templateElement("null")];
  expressions: ast.Expression[] = [];
}

class UndefinedTemplate implements Template {
  quasis: ast.TemplateElement[] = [ast.templateElement("undefined")];
  expressions: ast.Expression[] = [];
}

class IdentifierTemplate implements Template {
  quasis: ast.TemplateElement[] = [];
  expressions: ast.Expression[];

  constructor(node: ast.Identifier) {
    this.expressions = [node];
  }
}
