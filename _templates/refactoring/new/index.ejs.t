---
to: src/refactorings/<%= h.changeCase.param(name) %>/index.ts
---
<%
  camelName = h.changeCase.camel(name)
  dashedName = h.changeCase.param(name)
  titleName = h.changeCase.titleCase(name)
  sentenceName = h.changeCase.sentenceCase(name)

  camelActionProviderName = h.changeCase.camel(actionProviderName)
-%>
<% if (hasActionProvider){ -%>
import {
  <%= camelName %>,
  <%= camelActionProviderName %>
} from "./<%= dashedName %>";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "<%= camelName %>",
    operation: <%= camelName %>,
    title: "<%= titleName %>"
  },
  actionProvider: {
    message: "<%= sentenceName %>",
    canPerform: <%= camelActionProviderName %>
  }
};
<% } else { -%>
import { <%= camelName %> } from "./<%= dashedName %>";

import { Refactoring } from "../../types";

const config: Refactoring = {
  command: {
    key: "<%= camelName %>",
    operation: <%= camelName %>
  }
};
<% } -%>

export default config;
