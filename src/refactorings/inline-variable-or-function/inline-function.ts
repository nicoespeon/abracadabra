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

  if (updatedCode.isAssignedWithManyStatements) {
    editor.showError(ErrorReason.CantInlineAssignedFunctionWithManyStatements);
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
let isFunctionAssigned: boolean;

function updateCode(
  code: Code,
  selection: Selection
): ast.Transformed & {
  isExported: boolean;
  hasManyReturns: boolean;
  isAssignedWithoutReturn: boolean;
  isAssignedWithManyStatements: boolean;
} {
  let isExported = false;
  let hasManyReturns = false;
  let isAssignedWithoutReturn = false;
  let isAssignedWithManyStatements = false;
  isFunctionAssigned = false;

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
      isAssignedWithoutReturn,
      isAssignedWithManyStatements
    };
  }

  const result = ast.transform(
    code,
    createVisitorThat(path => {
      const returnStatementsCount = countReturnStatementsIn(path);
      hasManyReturns = returnStatementsCount === StatementsCount.Many;
      if (hasManyReturns) return;

      replaceAllIdentifiersWithFunction(path);

      isAssignedWithoutReturn =
        isFunctionAssigned && returnStatementsCount === StatementsCount.Zero;
      if (isAssignedWithoutReturn) return;

      isAssignedWithManyStatements =
        isFunctionAssigned && countStatementsIn(path) === StatementsCount.Many;
      if (isAssignedWithoutReturn) return;

      const { node } = path;
      const scope = ast.getFunctionScopePath(path).node;
      isExported =
        !!node.id && findExportedIdNames(scope).includes(node.id.name);
      if (isExported) return;

      path.remove();
    }, selection)
  );

  return {
    ...result,
    isExported,
    hasManyReturns,
    isAssignedWithoutReturn,
    isAssignedWithManyStatements
  };
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
      const validSelection = Selection.fromAST(node.id.loc).extendStartToEndOf(
        validSelectionStartPosition
      );
      if (!selection.isInside(validSelection)) return;

      update(path);
    }
  };
}

function countStatementsIn(path: ast.NodePath): StatementsCount {
  let result = StatementsCount.Zero;

  path.traverse({
    Statement(path) {
      if (ast.isBlockStatement(path)) return;

      result =
        result === StatementsCount.Zero
          ? StatementsCount.One
          : StatementsCount.Many;
    }
  });

  return result;
}

function countReturnStatementsIn(path: ast.NodePath): StatementsCount {
  let result = StatementsCount.Zero;

  path.traverse({
    ReturnStatement(path) {
      result =
        result === StatementsCount.Zero
          ? StatementsCount.One
          : StatementsCount.Many;

      // If return is in branched logic, then there is at least 2 returns.
      if (ast.isInBranchedLogic(path)) {
        result = StatementsCount.Many;
      }
    }
  });

  return result;
}

enum StatementsCount {
  Zero,
  One,
  Many
}

function replaceAllIdentifiersWithFunction(
  path: ast.NodePath<ast.FunctionDeclaration>
) {
  const { node } = path;
  if (!node.id) return;

  const parentPath = ast.getFunctionScopePath(path);
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

function replaceAllIdentifiersInPath(
  path: ast.NodePath,
  functionDeclaration: ast.FunctionDeclaration
) {
  const { node } = path;

  if (ast.isCallExpression(node)) {
    const identifier = node.callee;
    if (!isMatchingIdentifier(identifier, functionDeclaration)) return;

    const scopePath = path.findParent(
      parentPath =>
        ast.isVariableDeclarator(parentPath) ||
        ast.isAssignmentExpression(parentPath) ||
        ast.isCallExpression(parentPath)
    );

    // Set the global variable, as we know if it's assigned.
    isFunctionAssigned = Boolean(scopePath);

    replaceWithFunctionBody(
      scopePath || path,
      node.arguments,
      functionDeclaration
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

  if (ast.isReturnStatement(node)) {
    const identifier = node.argument;
    if (!isMatchingIdentifier(identifier, functionDeclaration)) return;

    node.argument = ast.functionExpression(
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

function replaceWithFunctionBody(
  path: ast.NodePath,
  values: ast.CallExpression["arguments"],
  functionDeclaration: ast.FunctionDeclaration
) {
  path.replaceWithMultiple(
    applyArgumentsToFunction(path, values, functionDeclaration)
  );
}

function applyArgumentsToFunction(
  path: ast.NodePath,
  values: ast.CallExpression["arguments"],
  functionDeclaration: ast.FunctionDeclaration
): ast.Statement[] {
  const functionBodyWithValuesApplied = ast.transformCopy(
    path,
    functionDeclaration.body,
    {
      Identifier(idPath) {
        const param = findParamMatchingId(
          idPath.node,
          functionDeclaration.params
        );
        if (!param.isMatch) return;

        const value = param.resolveValue(values) || ast.identifier("undefined");
        idPath.replaceWith(value);
      },

      ReturnStatement(returnPath) {
        if (ast.isInBranchedLogic(returnPath)) return;

        const scopeWithReturnValueApplied = ast.transformCopy(path, path.node, {
          CallExpression(childPath) {
            const identifier = childPath.node.callee;
            if (!isMatchingIdentifier(identifier, functionDeclaration)) return;
            if (!returnPath.node.argument) return;

            childPath.replaceWith(returnPath.node.argument);
          }
        });

        returnPath.replaceWith(scopeWithReturnValueApplied);
      }
    }
  );

  return functionBodyWithValuesApplied.body;
}
