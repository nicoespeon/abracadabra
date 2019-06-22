import { Code, Write } from "./i-write-code";
import { Selection } from "./selection";
import * as ast from "./ast";
import { ShowErrorMessage, ErrorReason } from "./i-show-error-message";

export { convertIfElseToTernary, hasIfElseToConvert };

async function convertIfElseToTernary(
  code: Code,
  selection: Selection,
  write: Write,
  showErrorMessage: ShowErrorMessage
) {
  const updatedCode = updateCode(code, selection);

  if (!updatedCode.hasSelectedNode || !updatedCode.loc) {
    showErrorMessage(ErrorReason.DidNotFoundIfElseToConvert);
    return;
  }

  await write([
    {
      code: updatedCode.code,
      selection: Selection.fromAST(updatedCode.loc)
    }
  ]);
}

function hasIfElseToConvert(code: Code, selection: Selection): boolean {
  return updateCode(code, selection).hasSelectedNode;
}

function updateCode(code: Code, selection: Selection): ast.Transformed {
  return ast.transform(code, selectNode => ({
    IfStatement(path) {
      const { node } = path;
      if (!ast.isSelectableNode(node)) return;
      if (!selection.isInside(Selection.fromAST(node.loc))) return;

      const ifReturnedArgument = getReturnedArgument(node.consequent);
      if (!ifReturnedArgument) return;

      const elseReturnedArgument = getReturnedArgument(node.alternate);
      if (!elseReturnedArgument) return;

      const ternary = ast.returnStatement(
        ast.conditionalExpression(
          node.test,
          ifReturnedArgument,
          elseReturnedArgument
        )
      );

      path.replaceWith(ternary);
      path.stop();

      selectNode(path.parentPath.node);
    }
  }));
}

function getReturnedArgument(
  node: ast.Statement | null
): ast.ReturnStatement["argument"] {
  if (!ast.isBlockStatement(node)) return null;

  const firstChild = node.body[0];
  if (!ast.isReturnStatement(firstChild)) return null;

  return firstChild.argument;
}
