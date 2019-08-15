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
import * as ast from "../../ast";

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
  const updatedCode = updateCode(code, selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.<%= pascalErrorName %>);
    return;
  }

  await editor.write(updatedCode.code);
}

<% if (hasActionProvider){ -%>
function <%= camelActionProviderName %>(code: Code, selection: Selection): boolean {
  return updateCode(code, selection).hasCodeChanged;
}
<% } -%>

function updateCode(code: Code, selection: Selection): ast.Transformed {
  return ast.transform(code, {
    // TODO: implement the transformation here 🧙‍
  });
}
