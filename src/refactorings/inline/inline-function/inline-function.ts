import { Editor, Code, ErrorReason } from "../../../editor/editor";
import { Selection } from "../../../editor/selection";
import * as t from "../../../ast";

import { findParamMatchingId } from "./find-param-matching-id";
import { findExportedIdNames } from "../find-exported-id-names";

export { inlineFunction };

async function inlineFunction(editor: Editor) {
  const { code, selection } = editor;
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
    editor.showError(ErrorReason.DidNotFindInlinableCode);
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
): t.Transformed & {
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

  const canInlineFunction = t.transform(
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

  const result = t.transform(
    code,
    createVisitorThat((path) => {
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
      const scope = t.getFunctionScopePath(path).node;
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
  update: (path: t.NodePath<t.FunctionDeclaration>) => void,
  selection: Selection
) {
  return {
    FunctionDeclaration(path: t.NodePath<t.FunctionDeclaration>) {
      const { node } = path;
      if (!node.id) return;
      if (!t.isSelectableNode(node)) return;
      if (!t.isSelectableNode(node.id)) return;

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

function countStatementsIn(path: t.NodePath): StatementsCount {
  let result = StatementsCount.Zero;

  path.traverse({
    Statement(path) {
      if (t.isBlockStatement(path)) return;

      result =
        result === StatementsCount.Zero
          ? StatementsCount.One
          : StatementsCount.Many;
    }
  });

  return result;
}

function countReturnStatementsIn(path: t.NodePath): StatementsCount {
  let result = StatementsCount.Zero;

  path.traverse({
    ReturnStatement(path) {
      result =
        result === StatementsCount.Zero
          ? StatementsCount.One
          : StatementsCount.Many;

      // If return is in branched logic, then there is at least 2 returns.
      if (t.isInBranchedLogic(path)) {
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
  path: t.NodePath<t.FunctionDeclaration>
) {
  const { node } = path;
  if (!node.id) return;

  const parentPath = t.getFunctionScopePath(path);
  const functionBinding = parentPath.scope.getBinding(node.id.name);

  if (functionBinding) {
    functionBinding.referencePaths
      .map((referencePath) => referencePath.parentPath)
      .filter(
        (scopePath): scopePath is t.NodePath<t.Node> => scopePath !== null
      )
      .forEach((scopePath) => replaceAllIdentifiersInPath(scopePath, node));
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
  path: t.NodePath,
  functionDeclaration: t.FunctionDeclaration
) {
  const { node } = path;

  if (t.isCallExpression(node)) {
    const identifier = node.callee;
    if (!isMatchingIdentifier(identifier, functionDeclaration)) return;

    const scopePath = path.findParent(
      (parentPath) =>
        t.isVariableDeclarator(parentPath) ||
        t.isAssignmentExpression(parentPath) ||
        t.isCallExpression(parentPath)
    );

    // Set the global variable, as we know if it's assigned.
    isFunctionAssigned = Boolean(scopePath);

    replaceWithFunctionBody(
      scopePath || path,
      node.arguments,
      functionDeclaration
    );
  }

  if (t.isVariableDeclarator(node)) {
    const identifier = node.init ?? null;
    if (!isMatchingIdentifier(identifier, functionDeclaration)) return;

    node.init = t.functionExpression(
      null,
      functionDeclaration.params,
      functionDeclaration.body
    );
  }

  if (t.isReturnStatement(node)) {
    const identifier = node.argument ?? null;
    if (!isMatchingIdentifier(identifier, functionDeclaration)) return;

    node.argument = t.functionExpression(
      null,
      functionDeclaration.params,
      functionDeclaration.body
    );
  }
}

function isMatchingIdentifier(
  identifier: t.Node | null,
  functionDeclaration: t.FunctionDeclaration
): identifier is t.Identifier {
  if (!functionDeclaration.id) return false;

  return (
    t.isIdentifier(identifier) &&
    identifier.name === functionDeclaration.id.name
  );
}

function replaceWithFunctionBody(
  path: t.NodePath,
  values: t.CallExpression["arguments"],
  functionDeclaration: t.FunctionDeclaration
) {
  path.replaceWithMultiple(
    applyArgumentsToFunction(path, values, functionDeclaration)
  );
}

function applyArgumentsToFunction(
  path: t.NodePath,
  values: t.CallExpression["arguments"],
  functionDeclaration: t.FunctionDeclaration
): t.Statement[] {
  const functionBodyWithValuesApplied = t.transformCopy(
    path,
    functionDeclaration.body,
    {
      Identifier(idPath) {
        const param = findParamMatchingId(
          idPath.node,
          functionDeclaration.params
        );
        if (!param.isMatch) return;

        const value = param.resolveValue(values) || t.identifier("undefined");
        idPath.replaceWith(value);
      },

      ReturnStatement(returnPath) {
        if (t.isInBranchedLogic(returnPath)) return;

        const nodeToReplace = path.isCallExpression()
          ? t.expressionStatement(path.node)
          : path.node;
        const scopeWithReturnValueApplied = t.transformCopy(
          path,
          nodeToReplace,
          {
            CallExpression(childPath) {
              const identifier = childPath.node.callee;
              if (!isMatchingIdentifier(identifier, functionDeclaration)) {
                return;
              }
              if (!returnPath.node.argument) return;

              childPath.replaceWith(returnPath.node.argument);
            }
          }
        );

        returnPath.replaceWith(scopeWithReturnValueApplied);
      }
    }
  );

  return functionBodyWithValuesApplied.body;
}
