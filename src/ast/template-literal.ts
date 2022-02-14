import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

/**
 * Override babel `templateElement()` because it exposes
 * unnecessary implementation details and it's not type-safe.
 */
export function templateElement(value: string): t.TemplateElement {
  return t.templateElement({
    raw: value,
    cooked: value
  });
}

export function convertStringToTemplateLiteral(
  path: NodePath<t.StringLiteral>,
  loc: t.SourceLocation
): t.TemplateLiteral {
  const quasi = templateElement(path.node.value);

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
