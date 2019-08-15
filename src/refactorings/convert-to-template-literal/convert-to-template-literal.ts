import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as ast from "../../ast";

export { convertToTemplateLiteral, canConvertToTemplateLiteral };

async function convertToTemplateLiteral(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(code, selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFoundStringToConvert);
    return;
  }

  await editor.write(updatedCode.code);
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

      const template = getTemplate(path.node);
      if (!template.isValid) return;
      if (!template.hasString) return;

      path.replaceWith(createTemplateLiteral(template));
      path.stop();
    },

    StringLiteral(path) {
      if (!selection.isInsidePath(path)) return;

      // In that case, we should go through the BinaryExpression logic.
      if (ast.isBinaryExpression(path.parentPath)) return;

      path.replaceWith(createTemplateLiteral(new PrimitiveTemplate(path.node)));
      path.stop();
    }
  });
}

function getTemplate(node: ast.BinaryExpression["left"]): Template {
  if (ast.isTemplateLiteral(node)) return new TemplateLiteralTemplate(node);
  if ("value" in node) return new PrimitiveTemplate(node);
  if (ast.isNullLiteral(node)) return new NullTemplate();
  if (ast.isUndefinedLiteral(node)) return new UndefinedTemplate();
  if (ast.isTemplateExpression(node)) return new ExpressionTemplate(node);

  if (ast.isBinaryExpression(node) && node.operator === "+") {
    return new CompositeTemplate(
      getTemplate(node.left),
      getTemplate(node.right)
    );
  }

  return new InvalidTemplate();
}

function createTemplateLiteral(template: Template): ast.TemplateLiteral {
  return ast.templateLiteral(
    // Intermediate interpolated quasis shouldn't be part of the final template.
    template.quasis.filter(quasi => !isInterpolated(quasi) || quasi.tail),
    template.expressions
  );
}

interface Template {
  isValid: boolean;
  hasString: boolean;
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

  get isValid() {
    return this.left.isValid && this.right.isValid;
  }

  get hasString() {
    return this.left.hasString || this.right.hasString;
  }
}

function isInterpolated(quasi: ast.TemplateElement): boolean {
  return quasi.value.raw === "";
}

class InvalidTemplate implements Template {
  isValid = false;
  hasString = false;
  quasis: ast.TemplateElement[] = [];
  expressions: ast.Expression[] = [];
}

class PrimitiveTemplate implements Template {
  isValid = true;
  expressions: ast.Expression[] = [];
  private node: ast.Primitive;

  constructor(node: ast.Primitive) {
    this.node = node;
  }

  get quasis() {
    return [ast.templateElement(this.node.value)];
  }

  get hasString() {
    return ast.isStringLiteral(this.node);
  }
}

class NullTemplate implements Template {
  isValid = true;
  hasString = false;
  quasis: ast.TemplateElement[] = [ast.templateElement("null")];
  expressions: ast.Expression[] = [];
}

class UndefinedTemplate implements Template {
  isValid = true;
  hasString = false;
  quasis: ast.TemplateElement[] = [ast.templateElement("undefined")];
  expressions: ast.Expression[] = [];
}

class ExpressionTemplate implements Template {
  isValid = true;
  hasString = false;
  quasis: ast.TemplateElement[] = [ast.templateElement("")];
  expressions: ast.Expression[];

  constructor(node: ast.Expression) {
    this.expressions = [node];
  }
}

class TemplateLiteralTemplate implements Template {
  isValid = true;
  hasString = true;
  quasis: ast.TemplateElement[];
  expressions: ast.Expression[];

  constructor(node: ast.TemplateLiteral) {
    this.quasis = node.quasis;
    this.expressions = node.expressions;
  }
}
