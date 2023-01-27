import * as t from "@babel/types";

/**
 * Remove the extra information Recast adds to nodes for formatting,
 * so it's easier to read them in logs.
 */
export function omitTokens(node: t.Node): Omit<t.Node, ""> {
  // @ts-expect-error At runtime, these attributes are added by Recast
  const { tokens, lines, loc, ...rest } = node;
  return rest;
}
