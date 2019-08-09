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

      path.replaceWith(createTemplateLiteral(getTemplate(path.node)));
      path.stop();
    },

    StringLiteral(path) {
      if (!selection.isInsidePath(path)) return;

      path.replaceWith(createTemplateLiteral(getTemplate(path.node)));
      path.stop();
    }
  });
}

function getTemplate(node: ast.BinaryExpression["left"]): Template {
  if (ast.isTemplateLiteral(node)) return node;
  if ("value" in node) return new PrimitiveTemplate(node);
  if (ast.isNullLiteral(node)) return new NullTemplate();
  if (ast.isUndefinedLiteral(node)) return new UndefinedTemplate();
  if (ast.isIdentifier(node)) return new IdentifierTemplate(node);

  if (ast.isBinaryExpression(node)) {
    return new CompositeTemplate(
      getTemplate(node.left),
      getTemplate(node.right)
    );
  }

  return new NoneTemplate();
}

function createTemplateLiteral(template: Template): ast.TemplateLiteral {
  return ast.templateLiteral(
    // Intermediate interpolated quasis shouldn't be part of the final template.
    template.quasis.filter(quasi => !isInterpolated(quasi) || quasi.tail),
    template.expressions
  );
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
    return [...this.left.quasis, ...this.right.quasis].reduce(
      (result, quasi) => {
        if (isInterpolated(quasi)) return [...result, quasi];

        const lastQuasi = result.pop();
        if (!lastQuasi) return [...result, quasi];
        if (isInterpolated(lastQuasi)) return [...result, lastQuasi, quasi];

        const consolidatedQuasi = ast.templateElement(
          lastQuasi.value.raw + quasi.value.raw
        );
        return [...result, consolidatedQuasi];
      },
      [] as ast.TemplateElement[]
    );
  }

  get expressions() {
    return [...this.left.expressions, ...this.right.expressions];
  }
}

function isInterpolated(quasi: ast.TemplateElement): boolean {
  return quasi.value.raw === "";
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
  quasis: ast.TemplateElement[] = [ast.templateElement("")];
  expressions: ast.Expression[];

  constructor(node: ast.Identifier) {
    this.expressions = [node];
  }
}
