---
inject: true
to: src/editor/i-show-error-message.ts
after: switch
---
<%
  pascalErrorName = h.changeCase.pascalCase(errorReason.name)
  noCaseErrorMessage = h.changeCase.noCase(errorReason.message)
-%>
    case ErrorReason.<%= pascalErrorName %>:
      return didNotFound("<%= noCaseErrorMessage %>");
