import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as ast from "../../ast";

import { findParamMatchingId } from "./find-param-matching-id";
import { findExportedIdNames } from "./find-exported-id-names";

export { inlineFunction };

async function inlineFunction(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(code, selection);

  if (updatedCode.hasManyReturns) {
    editor.showError(ErrorReason.CantInlineFunctionWithMultipleReturns);
    return;
  }

  if (updatedCode.isAssignedWithoutReturn) {
    editor.showError(ErrorReason.CantInlineAssignedFunctionWithoutReturn);
    return;
  }

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFoundInlinableCode);
    return;
  }

  if (updatedCode.isExported) {
    editor.showError(ErrorReason.CantRemoveExportedFunction);
    // We don't return because we still want to update the code.
  }

  await editor.write(updatedCode.code);
}

// This global variable is set later in the flow.
// This is not pretty and creates coupling in the code.
// Don't hesitate to refactor if you have a better design in mind.
let isFunctionAssignedToVariable: boolean;
function updateCode(
  code: Code,
  selection: Selection
): ast.Transformed & {
  isExported: boolean;
  hasManyReturns: boolean;
  isAssignedWithoutReturn: boolean;
} {
  let isExported = false;
  let hasManyReturns = false;
  let isAssignedWithoutReturn = false;
  isFunctionAssignedToVariable = false;

  const canInlineFunction = ast.transform(
    code,
    createVisitorThat(replaceAllIdentifiersWithFunction, selection)
  ).hasCodeChanged;

  if (!canInlineFunction) {
    return {
      code,
      hasCodeChanged: false,
      isExported,
      hasManyReturns,
      isAssignedWithoutReturn
    };
  }

  const result = ast.transform(
    code,
    createVisitorThat(path => {
      const returnStatementsCount = countReturnStatementsIn(path);
      hasManyReturns = returnStatementsCount === ReturnStatementsCount.Many;
      if (hasManyReturns) return;

      replaceAllIdentifiersWithFunction(path);

      isAssignedWithoutReturn =
        isFunctionAssignedToVariable &&
        returnStatementsCount === ReturnStatementsCount.Zero;
      if (isAssignedWithoutReturn) return;

      const { node } = path;
      const scope = getFunctionScopePath(path).node;
      isExported =
        !!node.id && findExportedIdNames(scope).includes(node.id.name);
      if (isExported) return;

      path.remove();
    }, selection)
  );

  return { ...result, isExported, hasManyReturns, isAssignedWithoutReturn };
}

function createVisitorThat(
  update: (path: ast.NodePath<ast.FunctionDeclaration>) => void,
  selection: Selection
) {
  return {
    FunctionDeclaration(path: ast.NodePath<ast.FunctionDeclaration>) {
      const { node } = path;
      if (!node.id) return;
      if (!ast.isSelectableNode(node)) return;
      if (!ast.isSelectableNode(node.id)) return;

      // We limit the valid selection to the `function nameOfFunction` part
      // to avoid conflicts with "Inline Variable" refactoring.
      const functionStartPosition = Selection.fromAST(node.loc).start;
      const validSelectionStartPosition = Selection.cursorAt(
        functionStartPosition.line,
        functionStartPosition.character
      );
      const validSelection = Selection.fromAST(node.id.loc).extendStartTo(
        validSelectionStartPosition
      );
      if (!selection.isInside(validSelection)) return;

      update(path);
    }
  };
}

function countReturnStatementsIn(path: ast.NodePath): ReturnStatementsCount {
  let result = ReturnStatementsCount.Zero;

  path.traverse({
    ReturnStatement(path) {
      result =
        result === ReturnStatementsCount.Zero
          ? ReturnStatementsCount.One
          : ReturnStatementsCount.Many;

      // If return is in branched logic, then there is at least 2 returns.
      if (isInBranchedLogic(path)) {
        result = ReturnStatementsCount.Many;
      }
    }
  });

  return result;
}

enum ReturnStatementsCount {
  Zero,
  One,
  Many
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
  const { node, parentPath } = path;

  if (ast.isCallExpression(node)) {
    const identifier = node.callee;
    if (!isMatchingIdentifier(identifier, functionDeclaration)) return;

    isFunctionAssignedToVariable =
      ast.isVariableDeclarator(parentPath.node) ||
      ast.isAssignmentExpression(parentPath.node);

    replaceWithFunctionBody(
      getScopePath(path),
      node.arguments,
      functionDeclaration,
      getOnReturnStatement(path)
    );
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

function getOnReturnStatement(path: ast.NodePath): OnReturnStatement {
  const { parentPath } = path;

  switch (parentPath.type) {
    case "VariableDeclarator":
      const variableDeclarator = parentPath.node as ast.VariableDeclarator;
      return returnPath => {
        if (isInBranchedLogic(returnPath)) return;

        returnPath.replaceWith(
          ast.variableDeclarator(
            variableDeclarator.id,
            returnPath.node.argument
          )
        );
      };

    case "AssignmentExpression":
      const assignmentExpression = parentPath.node as ast.AssignmentExpression;
      return returnPath => {
        if (isInBranchedLogic(returnPath)) return;
        if (!returnPath.node.argument) return;

        returnPath.replaceWith(
          ast.assignmentExpression(
            assignmentExpression.operator,
            assignmentExpression.left,
            returnPath.node.argument
          )
        );
      };

    default:
      return () => {};
  }
}

type OnReturnStatement = (path: ast.NodePath<ast.ReturnStatement>) => void;

function getScopePath(path: ast.NodePath): ast.NodePath {
  const { parentPath } = path;

  switch (parentPath.type) {
    case "VariableDeclarator":
      return parentPath;

    case "AssignmentExpression":
      return parentPath.parentPath;

    default:
      return path;
  }
}

function replaceWithFunctionBody(
  path: ast.NodePath,
  values: ast.CallExpression["arguments"],
  functionDeclaration: ast.FunctionDeclaration,
  onReturnStatement: (path: ast.NodePath<ast.ReturnStatement>) => void
) {
  path.replaceWithMultiple(
    applyArgumentsToFunction(
      path,
      values,
      functionDeclaration,
      onReturnStatement
    )
  );
}

function applyArgumentsToFunction(
  path: ast.NodePath,
  values: ast.CallExpression["arguments"],
  functionDeclaration: ast.FunctionDeclaration,
  onReturnStatement: (path: ast.NodePath<ast.ReturnStatement>) => void
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
  const [temporaryCopiedPath] = path.insertAfter(
    ast.cloneDeep(functionDeclaration.body)
  ) as [ast.NodePath<ast.BlockStatement>];

  temporaryCopiedPath.traverse({
    Identifier(idPath) {
      const param = findParamMatchingId(
        idPath.node,
        functionDeclaration.params
      );
      if (!param.isMatch) return;

      const value = param.resolveValue(values) || ast.identifier("undefined");
      idPath.replaceWith(value);
    },

    ReturnStatement: onReturnStatement
  });

  // We need to reference the node before we remove the path.
  const functionBlockStatement = temporaryCopiedPath.node;

  temporaryCopiedPath.remove();

  return functionBlockStatement.body;
}

function isInBranchedLogic(path: ast.NodePath<ast.ReturnStatement>) {
  return path.getAncestry().some(path => ast.isIfStatement(path));
}
