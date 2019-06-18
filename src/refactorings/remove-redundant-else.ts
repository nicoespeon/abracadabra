import { Code, Write } from "./i-write-code";
import { Selection } from "./selection";
import * as ast from "./ast";
import { ShowErrorMessage, ErrorReason } from "./i-show-error-message";

export { removeRedundantElse };

async function removeRedundantElse(
  code: Code,
  selection: Selection,
  write: Write,
  showErrorMessage: ShowErrorMessage
) {
  const updatedCode = removeElseFrom(code, selection);

  if (!updatedCode || !updatedCode.loc) {
    showErrorMessage(ErrorReason.DidNotFoundRedundantElse);
    return;
  }

  await write([
    {
      code: updatedCode.code,
      selection: Selection.fromAST(updatedCode.loc)
    }
  ]);
}

function removeElseFrom(
  code: Code,
  selection: Selection
): ast.Transformed | undefined {
  return ast.transform(code, replaceWith => ({
    IfStatement(path) {
      if (!ast.isSelectableNode(path.node)) return;
      if (!selection.isInside(Selection.fromAST(path.node.loc))) return;

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

        replaceWith(path.parentPath.node);
      }
    }
  }));
}
