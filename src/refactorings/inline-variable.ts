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
  const { id, valueLoc } = findInlinableCode(code, selection);

  if (!id || !valueLoc) {
    showErrorMessage(ErrorReason.DidNotFoundInlinableCode);
    return;
  }

  const idToReplaceLoc = findIdentifierToReplaceLoc(code, id);

  if (!idToReplaceLoc) {
    showErrorMessage(ErrorReason.DidNotFoundInlinableCodeIdentifiers);
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
      const { id, init } = node.declarations[0];
      if (!ast.isIdentifier(id) || !ast.isSelectableNode(id)) return;
      if (!init || !ast.isSelectableNode(init)) return;

      result.id = id;
      result.valueLoc = init.loc;
    }
  });

  return result;
}

function findIdentifierToReplaceLoc(
  code: Code,
  id: ast.SelectableIdentifier
): ast.SourceLocation | undefined {
  let result: ast.SourceLocation | undefined;

  ast.traverseAST(code, {
    enter({ node }) {
      if (!ast.isIdentifier(node)) return;
      if (!ast.isSelectableNode(node)) return;
      if (node.name !== id.name) return;

      const selection = Selection.fromAST(node.loc);
      const isSameIdentifier = selection.isInside(Selection.fromAST(id.loc));
      if (isSameIdentifier) return;

      result = node.loc;
    }
  });

  return result;
}

interface InlinableCode {
  id: ast.SelectableIdentifier | undefined;
  valueLoc: ast.SourceLocation | undefined;
}
