import * as t from "@babel/types";
import { NodePath } from "@babel/traverse";

import { isSelectablePath } from "./selection";
import { Selection } from "../editor/selection";

export { getExportDefaultDeclarationLoc };

/**
 * For some reason, default export declarations have no LOC.
 * That's likely a bug in the parser that would be solved at some point.
 *
 * Until then, we use `getExportDefaultDeclarationLoc` to work around this.
 */

function getExportDefaultDeclarationLoc(
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
    start: {
      line: path.node.loc.start.line,
      // Offset with `export default ` that is 15 chars
      column: path.node.loc.start.column + 15
    },
    end: {
      line: path.node.loc.end.line,
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
