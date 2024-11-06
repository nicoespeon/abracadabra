---
to: src/refactorings/<%= h.changeCase.param(name) %>/<%= h.changeCase.param(name) %>.ts
---
<%
  camelName = h.changeCase.camel(name)
  noCaseErrorMessage = h.changeCase.noCase(errorReason.message)
-%>
import * as t from "../../ast";
import { Selection } from "../../editor/selection";
import { COMMANDS, EditorCommand, RefactoringState } from "../../refactorings";

export async function <%= camelName %>(state: RefactoringState): EditorCommand {
  const updatedCode = updateCode(t.parse(state.code), state.selection);

  if (!updatedCode.hasCodeChanged) {
    return COMMANDS.showErrorDidNotFind("<%= noCaseErrorMessage %>");
  }

  return COMMANDS.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, path => {
      // TODO: implement the transformation here 🧙‍
    })
  );
}

export function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath) => void
): t.Visitor {
  // TODO: implement the check here 🧙‍
  return {};
}