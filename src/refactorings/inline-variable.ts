import { Code, UpdateWith } from "./i-update-code";
import { Selection } from "./selection";
import * as ast from "./ast";

export { inlineVariable };

async function inlineVariable(
  code: Code,
  selection: Selection,
  updateWith: UpdateWith
) {
  const { id, valueLoc } = findInlinableCode(code, selection);

  if (!id || !valueLoc) {
    // TODO: show error message
    return;
  }

  const idToReplaceLoc = findIdentifierToReplaceLoc(code, id);

  if (!idToReplaceLoc) {
    // TODO: show error message
    return;
  }

  const inlinedCodeSelection = Selection.fromAST(valueLoc);
  const idToReplaceSelection = Selection.fromAST(idToReplaceLoc);
  await updateWith(inlinedCodeSelection, inlinedCode => {
    return [
      {
        code: inlinedCode,
        selection: idToReplaceSelection
      },
      {
        code: "",
        selection: inlinedCodeSelection
          .extendToStartOfLine()
          .extendToStartOfNextLine()
      }
    ];
  });
}

function findInlinableCode(code: Code, selection: Selection): InlinableCode {
  let result: InlinableCode = {
    id: undefined,
    valueLoc: undefined
  };

  ast.traverseAST(code, {
    enter({ node }) {
      if (!ast.isSelectableNode(node)) return;
      if (!ast.isVariableDeclaration(node)) return;
      if (!selection.isInside(Selection.fromAST(node.loc))) return;

      // Only consider the first declared variable.
      const declaration = node.declarations[0];
      if (!ast.isIdentifier(declaration.id)) return;

      const value = declaration.init;
      if (!value || !ast.isSelectableNode(value)) return;

      result.id = declaration.id;
      result.valueLoc = value.loc;
    }
  });

  return result;
}

function findIdentifierToReplaceLoc(
  code: Code,
  id: ast.Identifier
): ast.SourceLocation | undefined {
  let result: ast.SourceLocation | undefined;

  ast.traverseAST(code, {
    enter({ node }) {
      if (!ast.isIdentifier(node)) return;
      if (!ast.isSelectableNode(node)) return;
      if (node.name !== id.name) return;

      result = node.loc;
    }
  });

  return result;
}

interface InlinableCode {
  id: ast.Identifier | undefined;
  valueLoc: ast.SourceLocation | undefined;
}
