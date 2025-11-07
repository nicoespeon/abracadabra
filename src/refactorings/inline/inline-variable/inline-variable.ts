import * as t from "../../../ast";
import { Code } from "../../../editor/editor";
import { Selection } from "../../../editor/selection";
import {
  COMMANDS,
  EditorCommand,
  RefactoringState
} from "../../../refactorings";
import {
  findInlinableCode,
  InlinableCode,
  InlinableTSTypeAlias,
  MultipleDeclarations,
  SingleDeclaration
} from "./find-inlinable-code";

export function inlineVariable(state: RefactoringState): EditorCommand {
  const { code, selection } = state;
  const inlinableCode = findInlinableCodeInAST(code, selection);

  if (!inlinableCode) {
    return COMMANDS.showErrorDidNotFind("inlinable code");
  }

  if (inlinableCode.isRedeclared) {
    return COMMANDS.showErrorICant("inline redeclared variables");
  }

  if (inlinableCode.isExported) {
    return COMMANDS.showErrorICant("inline exported variables");
  }

  if (!inlinableCode.hasIdentifiersToUpdate) {
    return COMMANDS.showErrorDidNotFind("identifiers to inline");
  }

  return COMMANDS.readThenWrite(inlinableCode.valueSelection, (inlinedCode) => {
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

  t.parseAndTraverseCode(
    code,
    createVisitor(selection, (_path, declaration) => {
      result = declaration;
    })
  );

  return result;
}

export function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath, declaration: InlinableCode) => void
): t.Visitor {
  return {
    VariableDeclaration(path) {
      const { node, parent } = path;

      // It seems variable declaration inside a named export may have no loc.
      // Use the named export loc in that situation.
      if (t.isExportNamedDeclaration(parent) && !t.isSelectableNode(node)) {
        node.loc = parent.loc;
      }

      if (!selection.isInsideNode(node)) return;

      const declarations = node.declarations.filter(
        t.isSelectableVariableDeclarator
      );

      if (declarations.length === 1) {
        const child = findInlinableCode(selection, parent, declarations[0]);
        if (!child) return;

        onMatch(path, new SingleDeclaration(child));
      } else {
        declarations.forEach((declaration, index) => {
          if (!selection.isInsideNode(declaration)) return;

          const previous = declarations[index - 1];
          const next = declarations[index + 1];
          if (!previous && !next) return;

          const child = findInlinableCode(selection, parent, declaration);
          if (!child) return;

          onMatch(path, new MultipleDeclarations(child, previous, next));
        });
      }
    },
    TSTypeAliasDeclaration(path) {
      const { node, parent } = path;

      // It seems variable declaration inside a named export may have no loc.
      // Use the named export loc in that situation.
      if (t.isExportNamedDeclaration(parent) && !t.isSelectableNode(node)) {
        node.loc = parent.loc;
      }

      if (!selection.isInsideNode(node)) return;

      const { typeAnnotation } = node;
      if (!t.isSelectablePath(path)) return;

      // So, this one is funny 🤡
      // We can't use `ast.isSelectableNode(typeAnnotation)` guard clause.
      // That's because `typeAnnotation` type is a union of 1939+ types.
      // So when TS tries to infer the type after the guard clause, it freezes.
      // Since we just want to get the `SourceLocation`, a simple check will do.
      if (!typeAnnotation.loc) return;

      onMatch(
        path,
        new SingleDeclaration(
          new InlinableTSTypeAlias(path, typeAnnotation.loc)
        )
      );
    }
  };
}
