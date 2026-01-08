import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { Selection } from "../editor/selection";
import { isSelectablePath } from "./selection";

/**
 * For some reason, default export declarations have no LOC.
 * That's likely a bug in the parser that would be solved at some point.
 *
 * Until then, we use `getExportDefaultDeclarationLoc` to work around this.
 */

export function getExportDefaultDeclarationLoc(
  path: NodePath<t.ExportDefaultDeclaration>
): t.SourceLocation | null {
  if (!isSelectablePath(path)) return null;

  let hasTrailingSemicolon = true;
  try {
    const { end: endOfExport } = Selection.fromAST(path.node.loc);

    // @ts-expect-error Recast does add `tokens` information
    const lastLine = (path.node.loc.tokens as Token[]).reduce(
      (result, line) => {
        const { start: startOfLine } = Selection.fromAST(line.loc);
        return startOfLine.isAfter(endOfExport) ? result : line.value;
      },
      ""
    );

    hasTrailingSemicolon = /;/.test(lastLine);
  } catch {}

  return {
    ...path.node.loc,
    start: {
      ...path.node.loc.start,
      // Offset with `export default ` that is 15 chars
      column: path.node.loc.start.column + 15
    },
    end: {
      ...path.node.loc.end,
      column: hasTrailingSemicolon
        ? path.node.loc.end.column - 1
        : path.node.loc.end.column
    }
  };
}

interface Token {
  value: string;
  loc: t.SourceLocation;
}
