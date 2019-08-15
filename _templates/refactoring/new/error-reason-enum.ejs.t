---
inject: true
to: src/editor/error-reason.ts
after: enum ErrorReason {
---
  <%= h.changeCase.pascalCase(errorReason.name) -%>,