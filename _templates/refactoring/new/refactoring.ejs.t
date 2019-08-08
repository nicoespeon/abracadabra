---
to: src/refactorings/<%= h.changeCase.param(name) %>/<%= h.changeCase.param(name) %>.ts
---
<%
  camelName = h.changeCase.camel(name)
-%>
import { Code, Write } from "../../editor/i-write-code";
import { Selection } from "../../editor/selection";
import {
  ShowErrorMessage,
  ErrorReason
} from "../../editor/i-show-error-message";
import * as ast from "../../ast";

<% if (hasActionProvider){ -%>
export { <%= camelName %>, <%= actionProviderName %> };
<% } else { -%>
export { <%= camelName %> };
<% } -%>

async function <%= camelName %>(
  code: Code,
  selection: Selection,
  write: Write,
  showErrorMessage: ShowErrorMessage
) {
  const updatedCode = updateCode(code, selection);

  if (!updatedCode.hasCodeChanged) {
    // TODO: create an error reason and use it here
    // showErrorMessage(ErrorReason.???);
    return;
  }

  await write(updatedCode.code);
}

<% if (hasActionProvider){ -%>
function <%= actionProviderName %>(code: Code, selection: Selection): boolean {
  return updateCode(code, selection).hasCodeChanged;
}
<% } -%>

function updateCode(code: Code, selection: Selection): ast.Transformed {
  return ast.transform(code, {
    // TODO: implement the transformation here 🧙‍
  });
}
