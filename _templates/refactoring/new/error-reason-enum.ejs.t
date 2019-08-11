---
inject: true
to: src/editor/i-show-error-message.ts
after: enum ErrorReason {
---
  <%= h.changeCase.pascalCase(errorReason.name) -%>,