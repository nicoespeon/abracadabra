import { Code, Write } from "../../editor/i-write-code";
import { Selection } from "../../editor/selection";
import {
  ShowErrorMessage,
  ErrorReason
} from "../../editor/i-show-error-message";
import * as ast from "../../ast";

export { inlineFunction };

async function inlineFunction(
  code: Code,
  selection: Selection,
  write: Write,
  showErrorMessage: ShowErrorMessage
) {
  const updatedCode = updateCode(code, selection);

  if (!updatedCode.hasCodeChanged) {
    showErrorMessage(ErrorReason.DidNotFoundInlinableCode);
    return;
  }

  await write(updatedCode.code);
}

function updateCode(code: Code, selection: Selection): ast.Transformed {
  return ast.transform(code, {
    FunctionDeclaration(path) {
      if (!ast.isSelectableNode(path.node)) return;
      if (!selection.isInside(Selection.fromAST(path.node.loc))) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      const parentPath = path.getFunctionParent() || path.parentPath;
      replaceAllIdentifiersInScopePath(parentPath, path.node);
      path.remove();
    }
  });
}

function hasChildWhichMatchesSelection(
  path: ast.NodePath,
  selection: Selection
): boolean {
  let result = false;

  path.traverse({
    FunctionDeclaration(childPath) {
      if (!ast.isSelectableNode(childPath.node)) return;
      if (!selection.isInside(Selection.fromAST(childPath.node.loc))) return;

      result = true;
      childPath.stop();
    }
  });

  return result;
}

function replaceAllIdentifiersInScopePath(
  scopePath: ast.NodePath,
  functionDeclaration: ast.FunctionDeclaration
) {
  scopePath.traverse({
    CallExpression(path) {
      const identifier = path.node.callee;
      if (!ast.isIdentifier(identifier)) return;
      if (!functionDeclaration.id) return;
      if (identifier.name !== functionDeclaration.id.name) return;

      const functionBody = applyArgumentsToFunction(path, functionDeclaration);
      path.replaceWithMultiple(functionBody);
    }
  });
}

function applyArgumentsToFunction(
  callExpressionPath: ast.NodePath<ast.CallExpression>,
  functionDeclaration: ast.FunctionDeclaration
): ast.Statement[] {
  /**
   * If we try to modify the original function declaration,
   * we'll impact all other references. A path can't be cloned.
   *
   * But if we clone the function node and insert it in the AST,
   * then we can traverse it and modify its params with the expected values.
   *
   * It's temporary though.
   * After we're done, we remove the inserted path. #magicTrick ✨
   */

  // We have to cast this one as `insertAfter()` return type is `any`.
  const [temporaryCopiedPath] = callExpressionPath.insertAfter(
    ast.cloneDeep(functionDeclaration)
  ) as [ast.NodePath<ast.FunctionDeclaration>];

  temporaryCopiedPath.traverse({
    Identifier(idPath) {
      const paramIndex = functionDeclaration.params.findIndex(
        param => ast.isIdentifier(param) && param.name === idPath.node.name
      );
      if (paramIndex < 0) return;

      const paramValues = callExpressionPath.node.arguments;
      const value = paramValues[paramIndex] || ast.identifier("undefined");
      idPath.replaceWith(value);
    }
  });

  // We need to reference the node before we remove the path.
  const functionBlockStatement = temporaryCopiedPath.node.body;

  temporaryCopiedPath.remove();

  return functionBlockStatement.body;
}
