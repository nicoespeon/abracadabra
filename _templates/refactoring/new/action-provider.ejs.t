---
to: "<%= hasActionProvider ? 'src/refactorings/' + h.changeCase.param(name) + '/action-provider.ts' : null %>"
---
<%
  camelName = h.changeCase.camel(name)
  pascalName = h.changeCase.pascalCase(name)
  dashedName = h.changeCase.param(name)
  titleName = h.changeCase.titleCase(name)
  sentenceName = h.changeCase.sentenceCase(name)

  camelActionProviderName = h.changeCase.camel(actionProviderName)
-%>
import {
  RefactoringActionProvider,
  createActionProviderFor
} from "../../action-providers";

import { commandKey } from "./command";
import { <%= camelActionProviderName %> } from "./<%= dashedName %>";

class <%= pascalName %>ActionProvider extends RefactoringActionProvider {
  actionMessage = "<%= sentenceName %>";
  commandKey = commandKey;
  title = "<%= titleName %>";
  canPerformRefactoring = <%= camelActionProviderName %>;
}

export default createActionProviderFor(new <%= pascalName %>ActionProvider());
