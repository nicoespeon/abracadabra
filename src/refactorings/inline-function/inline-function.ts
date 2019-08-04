import { Code, Write } from "../../editor/i-write-code";
import { Selection } from "../../editor/selection";
import {
  ShowErrorMessage,
  ErrorReason
} from "../../editor/i-show-error-message";
import * as ast from "../../ast";
import { findParamMatchingId } from "./find-param-matching-id";
import { findExportedIdNames } from "../inline-variable/find-exported-id-names";

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

  if (updatedCode.isExported) {
    showErrorMessage(ErrorReason.CantRemoveExportedFunction);
    // We don't return because we still want to update the code.
  }

  await write(updatedCode.code);
}

function updateCode(
  code: Code,
  selection: Selection
): ast.Transformed & { isExported: boolean } {
  let isExported = false;

  const canInlineFunction = ast.transform(
    code,
    createVisitorThat(replaceAllIdentifiersWithFunction, selection)
  ).hasCodeChanged;

  if (!canInlineFunction) {
    return { code, hasCodeChanged: false, isExported };
  }

  const result = ast.transform(
    code,
    createVisitorThat(path => {
      replaceAllIdentifiersWithFunction(path);

      const { node } = path;
      const scope = getFunctionScopePath(path).node;
      isExported =
        !!node.id && findExportedIdNames(scope).includes(node.id.name);
      if (isExported) return;

      path.remove();
    }, selection)
  );
  return { ...result, isExported };
}

function createVisitorThat(
  update: (path: ast.NodePath<ast.FunctionDeclaration>) => void,
  selection: Selection
) {
  return {
    FunctionDeclaration(path: ast.NodePath<ast.FunctionDeclaration>) {
      if (!ast.isSelectableNode(path.node)) return;
      if (!selection.isInside(Selection.fromAST(path.node.loc))) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      update(path);
    }
  };
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

function replaceAllIdentifiersWithFunction(
  path: ast.NodePath<ast.FunctionDeclaration>
) {
  const { node } = path;
  if (!node.id) return;

  const parentPath = getFunctionScopePath(path);
  const functionBinding = parentPath.scope.getBinding(node.id.name);

  if (functionBinding) {
    functionBinding.referencePaths
      .map(referencePath => referencePath.parentPath)
      .forEach(scopePath => replaceAllIdentifiersInPath(scopePath, node));
  } else {
    // If we don't get the bindings, traverse all the parent nodes.
    parentPath.traverse({
      enter(scopePath) {
        replaceAllIdentifiersInPath(scopePath, node);
      }
    });
  }
}

function getFunctionScopePath(
  path: ast.NodePath<ast.FunctionDeclaration>
): ast.NodePath {
  return path.getFunctionParent() || path.parentPath;
}

function replaceAllIdentifiersInPath(
  path: ast.NodePath,
  functionDeclaration: ast.FunctionDeclaration
) {
  const { node } = path;

  if (ast.isCallExpression(node)) {
    const identifier = node.callee;
    if (!isMatchingIdentifier(identifier, functionDeclaration)) return;

    const functionBody = applyArgumentsToFunction(
      path as ast.NodePath<ast.CallExpression>,
      functionDeclaration
    );
    path.replaceWithMultiple(functionBody);
  }

  if (ast.isVariableDeclarator(node)) {
    const identifier = node.init;
    if (!isMatchingIdentifier(identifier, functionDeclaration)) return;

    node.init = ast.functionExpression(
      null,
      functionDeclaration.params,
      functionDeclaration.body
    );
  }
}

function isMatchingIdentifier(
  identifier: ast.Node | null,
  functionDeclaration: ast.FunctionDeclaration
): identifier is ast.Identifier {
  if (!functionDeclaration.id) return false;

  return (
    ast.isIdentifier(identifier) &&
    identifier.name === functionDeclaration.id.name
  );
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
    ast.cloneDeep(functionDeclaration.body)
  ) as [ast.NodePath<ast.BlockStatement>];

  temporaryCopiedPath.traverse({
    Identifier(idPath) {
      const param = findParamMatchingId(
        idPath.node,
        functionDeclaration.params
      );
      if (!param.isMatch) return;

      const values = callExpressionPath.node.arguments;
      const value = param.resolveValue(values) || ast.identifier("undefined");
      idPath.replaceWith(value);
    }
  });

  // We need to reference the node before we remove the path.
  const functionBlockStatement = temporaryCopiedPath.node;

  temporaryCopiedPath.remove();

  return functionBlockStatement.body;
}
