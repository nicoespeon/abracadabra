import { Code, ReadThenWrite } from "./editor/i-write-code";
import { Selection } from "./editor/selection";
import { ShowErrorMessage, ErrorReason } from "./editor/i-show-error-message";
import * as ast from "./ast";

export { inlineVariable };

async function inlineVariable(
  code: Code,
  selection: Selection,
  readThenWrite: ReadThenWrite,
  showErrorMessage: ShowErrorMessage
) {
  const inlinableCode = findInlinableCode(code, selection);

  if (!inlinableCode) {
    showErrorMessage(ErrorReason.DidNotFoundInlinableCode);
    return;
  }

  const { scope, id } = inlinableCode;

  if (isRedeclaredIn(scope, id)) {
    showErrorMessage(ErrorReason.CantInlineRedeclaredVariables);
    return;
  }

  if (findExportedIdNames(scope).includes(id.name)) {
    showErrorMessage(ErrorReason.CantInlineExportedVariables);
    return;
  }

  const idsToReplaceLocs = findIdentifiersToReplaceLocs(scope, id);

  if (idsToReplaceLocs.length === 0) {
    showErrorMessage(ErrorReason.DidNotFoundInlinableCodeIdentifiers);
    return;
  }

  const inlinedCodeSelection = Selection.fromAST(inlinableCode.valueLoc);
  await readThenWrite(inlinedCodeSelection, inlinedCode => {
    return [
      // Replace all identifiers with inlined code
      ...idsToReplaceLocs.map(loc => ({
        code: inlinedCode,
        selection: Selection.fromAST(loc)
      })),
      // Remove the variable declaration
      {
        code: "",
        selection: getCodeToRemoveSelection(inlinableCode)
      }
    ];
  });
}

function isRedeclaredIn(scope: ast.Node, id: ast.Identifier): boolean {
  let result = false;

  ast.traverse(scope, {
    enter(node) {
      if (!ast.isAssignmentExpression(node)) return;
      if (!isMatchingIdentifier(id, node.left)) return;

      result = true;
    }
  });

  return result;
}

function findExportedIdNames(scope: ast.Node): ast.Identifier["name"][] {
  let result: ast.Identifier["name"][] = [];

  ast.traverse(scope, {
    enter(node) {
      // Pattern `export default foo`
      if (
        ast.isExportDefaultDeclaration(node) &&
        ast.isIdentifier(node.declaration)
      ) {
        result.push(node.declaration.name);
      }

      if (ast.isExportNamedDeclaration(node)) {
        // Pattern `export const foo = "bar", hello = "world"`
        if (ast.isVariableDeclaration(node.declaration)) {
          node.declaration.declarations.forEach(({ id }) => {
            if (!("name" in id)) return;
            result.push(id.name);
          });
        }

        // Pattern `export { foo, hello }`
        node.specifiers.forEach(specifier => {
          if (!ast.isExportSpecifier(specifier)) return;
          result.push(specifier.local.name);
        });
      }
    }
  });

  return result;
}

function findInlinableCode(
  code: Code,
  selection: Selection
): InlinableCode | null {
  let result: InlinableCode | null = null;

  ast.traverseAST(code, {
    enter({ node, parent }) {
      // It seems variable declaration inside a named export may have no loc.
      // Use the named export loc in that situation.
      if (ast.isExportNamedDeclaration(parent) && !ast.isSelectableNode(node)) {
        node.loc = parent.loc;
      }

      if (!ast.isSelectableNode(node)) return;
      if (!ast.isVariableDeclaration(node)) return;
      if (!selection.isInside(Selection.fromAST(node.loc))) return;

      const declarations = node.declarations.filter(
        ast.isSelectableVariableDeclarator
      );

      if (declarations.length === 1) {
        const { id, init } = declarations[0];
        if (!ast.isSelectableIdentifier(id)) return;
        if (!ast.isSelectableNode(init)) return;

        result = {
          id,
          valueLoc: init.loc,
          scope: parent
        };
        return;
      }

      declarations.forEach((declaration, index) => {
        if (!selection.isInside(Selection.fromAST(declaration.loc))) return;

        const { id, init } = declaration;
        if (!ast.isSelectableIdentifier(id)) return;
        if (!ast.isSelectableNode(init)) return;

        const previousDeclaration = declarations[index - 1];
        const nextDeclaration = declarations[index + 1];
        if (!previousDeclaration && !nextDeclaration) return;

        // We prefer to use the next declaration by default.
        // Fallback on previous declaration when current is the last one.
        const multiDeclarationsLocs = !!nextDeclaration
          ? {
              isOtherAfterCurrent: true,
              current: declaration.loc,
              other: nextDeclaration.loc
            }
          : {
              isOtherAfterCurrent: false,
              current: declaration.loc,
              other: previousDeclaration.loc
            };

        result = {
          id,
          valueLoc: init.loc,
          multiDeclarationsLocs,
          scope: parent
        };
      });
    }
  });

  return result;
}

function findIdentifiersToReplaceLocs(
  scope: ast.Node,
  id: ast.SelectableIdentifier
): ast.SourceLocation[] {
  let result: ast.SourceLocation[] = [];

  ast.traverse(scope, {
    enter(node, ancestors) {
      if (!ast.isSelectableNode(node)) return;
      if (!isMatchingIdentifier(id, node)) return;
      if (isShadowIn(id, ancestors)) return;

      const selection = Selection.fromAST(node.loc);
      const isSameIdentifier = selection.isInside(Selection.fromAST(id.loc));
      if (isSameIdentifier) return;

      const parent = ancestors[ancestors.length - 1];
      if (ast.isFunctionDeclaration(parent)) return;
      if (ast.isObjectProperty(parent.node) && parent.node.key === node) return;
      if (ast.isMemberExpression(parent.node)) return;

      result.push(node.loc);
    }
  });

  return result;
}

function isShadowIn(
  id: ast.Identifier,
  ancestors: ast.TraversalAncestors
): boolean {
  // A variable is "shadow" if one of its ancestor redefines the Identifier.
  return ancestors.some(
    ({ node }) => isDeclaredInFunction(node) || isDeclaredInScope(node)
  );

  function isDeclaredInFunction(node: ast.Node): boolean {
    return (
      ast.isFunctionDeclaration(node) &&
      node.params.some(node => isMatchingIdentifier(id, node))
    );
  }

  function isDeclaredInScope(node: ast.Node): boolean {
    return (
      ast.isBlockStatement(node) &&
      node.body.some(
        child =>
          ast.isVariableDeclaration(child) &&
          child.declarations.some(
            declaration =>
              ast.isVariableDeclarator(declaration) &&
              isMatchingIdentifier(id, declaration.id) &&
              // Of course, if it's the inlined variable it's not a shadow!
              declaration.id !== id
          )
      )
    );
  }
}

function isMatchingIdentifier(id: ast.Identifier, node: ast.Node): boolean {
  return ast.isIdentifier(node) && node.name === id.name;
}

function getCodeToRemoveSelection(inlinableCode: InlinableCode): Selection {
  const { multiDeclarationsLocs } = inlinableCode;

  if (!multiDeclarationsLocs) {
    return Selection.fromAST(inlinableCode.valueLoc)
      .extendStartTo(Selection.fromAST(inlinableCode.id.loc))
      .extendToStartOfLine()
      .extendToStartOfNextLine();
  }

  const { isOtherAfterCurrent, current, other } = multiDeclarationsLocs;
  return isOtherAfterCurrent
    ? Selection.fromAST(current).extendEndTo(Selection.fromAST(other))
    : Selection.fromAST(current).extendStartTo(Selection.fromAST(other));
}

interface InlinableCode {
  scope: ast.Node;
  id: ast.SelectableIdentifier;
  valueLoc: ast.SourceLocation;
  multiDeclarationsLocs?: MultiDeclarationsLocs;
}

interface MultiDeclarationsLocs {
  isOtherAfterCurrent: boolean;
  current: ast.SourceLocation;
  other: ast.SourceLocation;
}
