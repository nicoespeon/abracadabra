---
inject: true
to: src/editor/error-reason.ts
after: switch
---
<%
  pascalErrorName = h.changeCase.pascalCase(errorReason.name)
  noCaseErrorMessage = h.changeCase.noCase(errorReason.message)
-%>
    case ErrorReason.<%= pascalErrorName %>:
      return didNotFind("<%= noCaseErrorMessage %>");
