---
to: src/refactorings/<%= h.changeCase.param(name) %>/<%= h.changeCase.param(name) %>.ts
---
<%
  camelName = h.changeCase.camel(name)
  camelActionProviderName = h.changeCase.camel(actionProviderName)
  pascalErrorName = h.changeCase.pascalCase(errorReason.name)
-%>
import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

<% if (hasActionProvider){ -%>
export { <%= camelName %>, <%= camelActionProviderName %> };
<% } else { -%>
export { <%= camelName %> };
<% } -%>

async function <%= camelName %>(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.<%= pascalErrorName %>);
    return;
  }

  await editor.write(updatedCode.code);
}

<% if (hasActionProvider){ -%>
function <%= camelActionProviderName %>(ast: t.AST, selection: Selection): boolean {
  // TODO: implement the check here 🧙‍
  return false;
}
<% } -%>

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(ast, {
    // TODO: implement the transformation here 🧙‍
  });
}
