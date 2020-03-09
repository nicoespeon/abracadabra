import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { convertToTemplateLiteral, canConvertToTemplateLiteral };

async function convertToTemplateLiteral(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindStringToConvert);
    return;
  }

  await editor.write(updatedCode.code);
}

function canConvertToTemplateLiteral(
  ast: t.AST,
  selection: Selection
): boolean {
  let result = false;

  t.traverseAST(ast, {
    BinaryExpression(path) {
      if (!selection.isInsidePath(path)) return;

      const template = getTemplate(path.node);
      if (!template.isValid) return;
      if (!template.hasString) return;

      result = true;
    },

    StringLiteral(path) {
      if (!selection.isInsidePath(path)) return;

      // In that case, we should go through the BinaryExpression logic.
      if (t.isBinaryExpression(path.parentPath)) return;

      // If we are inside of an import statement, dont show refactoring
      if (t.isImportDeclaration(path.parentPath)) return;

      result = true;
    }
  });

  return result;
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(ast, {
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
      if (t.isBinaryExpression(path.parentPath)) return;

      // If we are inside of an import statement, do nothing
      if (t.isImportDeclaration(path.parentPath)) return;

      const templateLiteral = createTemplateLiteral(
        new PrimitiveTemplate(path.node)
      );

      if (t.isJSXAttribute(path.parentPath)) {
        // Case of <MyComponent prop="test" /> => <MyComponent prop={`test`} />
        path.replaceWith(t.jsxExpressionContainer(templateLiteral));
      } else {
        path.replaceWith(templateLiteral);
      }

      path.stop();
    }
  });
}

function getTemplate(node: t.BinaryExpression["left"]): Template {
  if (t.isTemplateLiteral(node)) return new TemplateLiteralTemplate(node);
  if ("value" in node) return new PrimitiveTemplate(node);
  if (t.isNullLiteral(node)) return new NullTemplate();
  if (t.isUndefinedLiteral(node)) return new UndefinedTemplate();
  if (t.isTemplateExpression(node)) return new ExpressionTemplate(node);

  if (t.isBinaryExpression(node) && node.operator === "+") {
    return new CompositeTemplate(
      getTemplate(node.left),
      getTemplate(node.right)
    );
  }

  return new InvalidTemplate();
}

function createTemplateLiteral(template: Template): t.TemplateLiteral {
  return t.templateLiteral(
    // Intermediate interpolated quasis shouldn't be part of the final template.
    template.quasis.filter(quasi => !isInterpolated(quasi) || quasi.tail),
    template.expressions
  );
}

interface Template {
  isValid: boolean;
  hasString: boolean;
  quasis: t.TemplateElement[];
  expressions: t.Expression[];
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

        const consolidatedQuasi = t.templateElement(
          lastQuasi.value.raw + quasi.value.raw
        );
        return [...result, consolidatedQuasi];
      },
      [] as t.TemplateElement[]
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

function isInterpolated(quasi: t.TemplateElement): boolean {
  return quasi.value.raw === "";
}

class InvalidTemplate implements Template {
  isValid = false;
  hasString = false;
  quasis: t.TemplateElement[] = [];
  expressions: t.Expression[] = [];
}

class PrimitiveTemplate implements Template {
  isValid = true;
  expressions: t.Expression[] = [];
  private node: t.Primitive;

  constructor(node: t.Primitive) {
    this.node = node;
  }

  get quasis() {
    return [t.templateElement(this.node.value)];
  }

  get hasString() {
    return t.isStringLiteral(this.node);
  }
}

class NullTemplate implements Template {
  isValid = true;
  hasString = false;
  quasis: t.TemplateElement[] = [t.templateElement("null")];
  expressions: t.Expression[] = [];
}

class UndefinedTemplate implements Template {
  isValid = true;
  hasString = false;
  quasis: t.TemplateElement[] = [t.templateElement("undefined")];
  expressions: t.Expression[] = [];
}

class ExpressionTemplate implements Template {
  isValid = true;
  hasString = false;
  quasis: t.TemplateElement[] = [t.templateElement("")];
  expressions: t.Expression[];

  constructor(node: t.Expression) {
    this.expressions = [node];
  }
}

class TemplateLiteralTemplate implements Template {
  isValid = true;
  hasString = true;
  quasis: t.TemplateElement[];
  expressions: t.Expression[];

  constructor(node: t.TemplateLiteral) {
    this.quasis = node.quasis;
    this.expressions = node.expressions;
  }
}
