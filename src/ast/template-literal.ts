import * as t from "@babel/types";

export { templateElement, convertStringToTemplateLiteral };

/**
 * Override babel `templateElement()` because it exposes
 * unnecessary implementation details and it's not type-safe.
 */
function templateElement(value: string): t.TemplateElement {
  return t.templateElement({
    raw: value,
    cooked: value
  });
}

function convertStringToTemplateLiteral(
  node: t.StringLiteral,
  loc: t.SourceLocation
): t.TemplateLiteral {
  const quasi = templateElement(node.value);

  // Set proper location to created quasi.
  // quasi is offset by 1 because the ` worth 0 for template literals
  quasi.loc = {
    ...loc,
    start: {
      ...loc.start,
      column: loc.start.column + 1
    }
  };

  return t.templateLiteral([quasi], []);
}
