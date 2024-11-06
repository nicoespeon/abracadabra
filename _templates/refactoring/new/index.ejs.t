---
to: src/refactorings/<%= h.changeCase.param(name) %>/index.ts
---
<%
  camelName = h.changeCase.camel(name)
  dashedName = h.changeCase.param(name)
  titleName = h.changeCase.titleCase(name)
  sentenceName = h.changeCase.sentenceCase(name)
-%>
<% if (hasActionProvider){ -%>
import { RefactoringWithActionProviderConfig } from "../../refactorings";
import {
  <%= camelName %>,
  createVisitor
} from "./<%= dashedName %>";

const config: RefactoringWithActionProviderConfig = {
  command: {
    key: "<%= camelName %>",
    operation: <%= camelName %>,
    title: "<%= titleName %>"
  },
  actionProvider: {
    message: "<%= sentenceName %>",
    createVisitor
  }
};
<% } else { -%>
import { RefactoringConfig } from "../../refactorings";
import { <%= camelName %> } from "./<%= dashedName %>";

const config: RefactoringConfig = {
  command: {
    key: "<%= camelName %>",
    operation: <%= camelName %>
  }
};
<% } -%>

export default config;
