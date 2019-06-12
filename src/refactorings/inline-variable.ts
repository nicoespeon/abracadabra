import { Code, UpdateWith } from "./i-update-code";
import { Selection } from "./selection";
import * as ast from "./ast";
import { ShowErrorMessage, ErrorReason } from "./i-show-error-message";

export { inlineVariable };

async function inlineVariable(
  code: Code,
  selection: Selection,
  updateWith: UpdateWith,
  showErrorMessage: ShowErrorMessage
) {
  const exportedIdNames = findExportedIdNames(code);
  const inlinableCode = findInlinableCode(code, selection);
  const { id, valueLoc, multiDeclarationsLocs } = inlinableCode;

  if (!id || !valueLoc) {
    showErrorMessage(ErrorReason.DidNotFoundInlinableCode);
    return;
  }

  if (exportedIdNames.includes(id.name)) {
    showErrorMessage(ErrorReason.CantInlineExportedVariables);
    return;
  }

  const idsToReplaceLocs = findIdentifiersToReplaceLocs(code, id);

  if (idsToReplaceLocs.length === 0) {
    showErrorMessage(ErrorReason.DidNotFoundInlinableCodeIdentifiers);
    return;
  }

  const inlinedCodeSelection = Selection.fromAST(valueLoc);
  await updateWith(inlinedCodeSelection, inlinedCode => {
    return [
      // Replace all identifiers with inlined code
      ...idsToReplaceLocs.map(loc => ({
        code: inlinedCode,
        selection: Selection.fromAST(loc)
      })),
      // Remove the variable declaration
      {
        code: "",
        selection: getCodeToRemoveSelection(
          inlinedCodeSelection,
          multiDeclarationsLocs
        )
      }
    ];
  });
}

function findExportedIdNames(code: Code): ast.Identifier["name"][] {
  let result: ast.Identifier["name"][] = [];

  ast.traverseAST(code, {
    enter({ node, parent }) {
      if (!ast.isExportDeclaration(parent)) return;

      // Pattern `export default foo`
      if (ast.isIdentifier(node)) {
        result.push(node.name);
      }

      // Pattern `export { foo, hello }`
      if (ast.isExportSpecifier(node)) {
        result.push(node.local.name);
      }

      // Pattern `export const foo = "bar", hello = "world"`
      if (ast.isVariableDeclaration(node)) {
        node.declarations.forEach(declaration => {
          if (!("name" in declaration.id)) return;
          result.push(declaration.id.name);
        });
      }
    }
  });

  return result;
}

function findInlinableCode(code: Code, selection: Selection): InlinableCode {
  let result: InlinableCode = {};

  ast.traverseAST(code, {
    enter({ node }) {
      if (!ast.isSelectableNode(node)) return;
      if (!ast.isVariableDeclaration(node)) return;
      if (!selection.isInside(Selection.fromAST(node.loc))) return;

      const declarations = node.declarations.filter(
        ast.isSelectableVariableDeclarator
      );

      if (declarations.length === 1) {
        result = getPartialInlinableCodeFrom(declarations[0]);
      } else {
        declarations.forEach((declaration, index) => {
          if (!selection.isInside(Selection.fromAST(declaration.loc))) return;

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
            ...getPartialInlinableCodeFrom(declaration),
            multiDeclarationsLocs
          };
        });
      }
    }
  });

  return result;
}

function getPartialInlinableCodeFrom(
  declaration: ast.SelectableVariableDeclarator
): InlinableCode {
  const { id, init } = declaration;

  if (!ast.isIdentifier(id) || !ast.isSelectableNode(id)) return {};
  if (!init || !ast.isSelectableNode(init)) return {};

  return {
    id,
    valueLoc: init.loc
  };
}

function findIdentifiersToReplaceLocs(
  code: Code,
  id: ast.SelectableIdentifier
): ast.SourceLocation[] {
  let result: ast.SourceLocation[] = [];

  ast.traverseAST(code, {
    enter({ node }) {
      if (!ast.isIdentifier(node)) return;
      if (!ast.isSelectableNode(node)) return;
      if (node.name !== id.name) return;

      const selection = Selection.fromAST(node.loc);
      const isSameIdentifier = selection.isInside(Selection.fromAST(id.loc));
      if (isSameIdentifier) return;

      result.push(node.loc);
    }
  });

  return result;
}

function getCodeToRemoveSelection(
  inlinedCodeSelection: Selection,
  multiVariablesLocs: MultiDeclarationsLocs | undefined
): Selection {
  if (!multiVariablesLocs) {
    return inlinedCodeSelection.extendToStartOfLine().extendToStartOfNextLine();
  }

  const { isOtherAfterCurrent, current, other } = multiVariablesLocs;
  return isOtherAfterCurrent
    ? Selection.fromAST(current).extendEndTo(Selection.fromAST(other))
    : Selection.fromAST(current).extendStartTo(Selection.fromAST(other));
}

interface InlinableCode {
  id?: ast.SelectableIdentifier;
  valueLoc?: ast.SourceLocation;
  multiDeclarationsLocs?: MultiDeclarationsLocs;
}

interface MultiDeclarationsLocs {
  isOtherAfterCurrent: boolean;
  current: ast.SourceLocation;
  other: ast.SourceLocation;
}
