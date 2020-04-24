import { Editor, Code, ErrorReason } from "../../../editor/editor";
import { Selection } from "../../../editor/selection";
import * as ast from "../../../ast";

import {
  findInlinableCode,
  InlinableCode,
  SingleDeclaration,
  MultipleDeclarations,
  InlinableTSTypeAlias
} from "./find-inlinable-code";

export { inlineVariable };

async function inlineVariable(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const inlinableCode = findInlinableCodeInAST(code, selection);

  if (!inlinableCode) {
    editor.showError(ErrorReason.DidNotFindInlinableCode);
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
    editor.showError(ErrorReason.DidNotFindInlinableCodeIdentifiers);
    return;
  }

  await editor.readThenWrite(inlinableCode.valueSelection, inlinedCode => {
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

  ast.parseAndTraverseCode(code, {
    VariableDeclaration(path) {
      const { node, parent } = path;

      // It seems variable declaration inside a named export may have no loc.
      // Use the named export loc in that situation.
      if (ast.isExportNamedDeclaration(parent) && !ast.isSelectableNode(node)) {
        node.loc = parent.loc;
      }

      if (!selection.isInsideNode(node)) return;

      const declarations = node.declarations.filter(
        ast.isSelectableVariableDeclarator
      );

      if (declarations.length === 1) {
        const child = findInlinableCode(selection, parent, declarations[0]);
        if (!child) return;

        result = new SingleDeclaration(child);
      } else {
        declarations.forEach((declaration, index) => {
          if (!selection.isInsideNode(declaration)) return;

          const previous = declarations[index - 1];
          const next = declarations[index + 1];
          if (!previous && !next) return;

          const child = findInlinableCode(selection, parent, declaration);
          if (!child) return;

          result = new MultipleDeclarations(child, previous, next);
        });
      }
    },
    TSTypeAliasDeclaration(path) {
      const { node, parent } = path;

      // It seems variable declaration inside a named export may have no loc.
      // Use the named export loc in that situation.
      if (ast.isExportNamedDeclaration(parent) && !ast.isSelectableNode(node)) {
        node.loc = parent.loc;
      }

      if (!selection.isInsideNode(node)) return;

      const { typeAnnotation } = node;
      if (!ast.isSelectablePath(path)) return;

      // So, this one is funny 🤡
      // We can't use `ast.isSelectableNode(typeAnnotation)` guard clause.
      // That's because `typeAnnotation` type is a union of 1939+ types.
      // So when TS tries to infer the type after the guard clause, it freezes.
      // Since we just want to get the `SourceLocation`, a simple check will do.
      if (!typeAnnotation.loc) return;

      result = new SingleDeclaration(
        new InlinableTSTypeAlias(path, typeAnnotation.loc)
      );
    }
  });

  return result;
}
