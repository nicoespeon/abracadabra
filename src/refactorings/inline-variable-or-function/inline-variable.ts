import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as ast from "../../ast";

import {
  findInlinableCode,
  InlinableCode,
  InlinableIdentifier,
  InlinableDeclarations
} from "./find-inlinable-code";

export { inlineVariable };

async function inlineVariable(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const inlinableCode = findInlinableCodeInAST(code, selection);

  if (!inlinableCode) {
    editor.showError(ErrorReason.DidNotFoundInlinableCode);
    return;
  }

  if (inlinableCode.isRedeclared) {
    editor.showError(ErrorReason.CantInlineRedeclaredVariables);
    return;
  }

  if (inlinableCode.isExported) {
    editor.showError(ErrorReason.CantInlineExportedVariables);
    return;
  }

  if (!inlinableCode.hasIdentifiersToUpdate) {
    editor.showError(ErrorReason.DidNotFoundInlinableCodeIdentifiers);
    return;
  }

  await editor.readThenWrite(inlinableCode.selection, inlinedCode => {
    return [
      // Replace all identifiers with inlined code
      ...inlinableCode.updateIdentifiersWith(inlinedCode),
      // Remove the variable declaration
      {
        code: "",
        selection: inlinableCode.codeToRemoveSelection
      }
    ];
  });
}

function findInlinableCodeInAST(
  code: Code,
  selection: Selection
): InlinableCode | null {
  let result: InlinableCode | null = null;

  ast.traverseAST(code, {
    enter(path) {
      const { node, parent } = path;

      // It seems variable declaration inside a named export may have no loc.
      // Use the named export loc in that situation.
      if (ast.isExportNamedDeclaration(parent) && !ast.isSelectableNode(node)) {
        node.loc = parent.loc;
      }

      if (!ast.isVariableDeclaration(node)) return;
      if (!selection.isInsideNode(node)) return;

      const declarations = node.declarations.filter(
        ast.isSelectableVariableDeclarator
      );

      if (declarations.length === 1) {
        const { id, init } = declarations[0];
        result = findInlinableCode(parent, id, init);
        return;
      }

      declarations.forEach((declaration, index) => {
        if (!selection.isInsideNode(declaration)) return;

        const previousDeclaration = declarations[index - 1];
        const nextDeclaration = declarations[index + 1];
        if (!previousDeclaration && !nextDeclaration) return;

        // We prefer to use the next declaration by default.
        // Fallback on previous declaration when current is the last one.
        const declarationsLocs = !!nextDeclaration
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

        const { id, init } = declaration;
        if (!ast.isSelectableNode(init)) return;
        if (!ast.isSelectableIdentifier(id)) return;

        const inlinableId = new InlinableIdentifier(id, parent, init.loc);

        result = new InlinableDeclarations(inlinableId, declarationsLocs);
      });
    }
  });

  return result;
}
