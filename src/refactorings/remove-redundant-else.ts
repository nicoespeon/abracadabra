import { Code, UpdateWith } from "./i-update-code";
import { Selection } from "./selection";
import * as ast from "./ast";
import { ShowErrorMessage, ErrorReason } from "./i-show-error-message";

export { removeRedundantElse };

async function removeRedundantElse(
  code: Code,
  selection: Selection,
  updateWith: UpdateWith,
  showErrorMessage: ShowErrorMessage
) {
  // TODO: use another simpler update pattern to do everything once (selection & transform).
  await updateWith(selection, _ => {
    const updatedCode = removeElseFrom(code, selection);

    if (!updatedCode) {
      showErrorMessage(ErrorReason.DidNotFoundRedundantElse);
      return [];
    }

    return [
      {
        code: updatedCode.code,
        selection: Selection.fromAST(updatedCode.loc)
      }
    ];
  });
}

function removeElseFrom(
  code: Code,
  // TODO: filter using selection (expand, limit, etc.)
  _selection: Selection
): { code: Code; loc: ast.SourceLocation } | undefined {
  let loc: ast.SourceLocation | null = null;

  const resultCode = ast.transform(code, setNode => ({
    IfStatement(path) {
      // TODO: test when there is a throw instead of return statement
      if (
        ast.isBlockStatement(path.node.consequent) &&
        !ast.isReturnStatement(
          path.node.consequent.body[path.node.consequent.body.length - 1]
        )
      ) {
        return;
      }

      const elseBranch = path.node.alternate;
      // TODO: handle other type of nodes
      if (elseBranch && ast.isBlockStatement(elseBranch)) {
        path.node.alternate = null;
        // TODO: try with other elements in body to see if position is correct
        path.replaceWithMultiple([path.node, ...elseBranch.body]);
        // TODO: try not to use `setNode`
        setNode(path.parentPath.node);
        loc = path.parentPath.node.loc;
      }
    }
  }));

  if (!resultCode) return;
  if (!loc) return;

  return { code: resultCode, loc };
}
