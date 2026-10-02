# 18. Stay on Babel 7

Date: 2026-10-01

## Status

Accepted

## Context

Babel 8 was released on 2026-06-16. We tried to upgrade `@babel/parser`, `@babel/traverse` and `@babel/types` to 8.0.6 and hit 3 problems:

1. [Recast][recast] can't print some of the new TypeScript nodes, like `TSClassImplements`. The latest [ast-types][ast-types] (0.16.3) doesn't define them. This is outside of our control. As of 2026-10-01, no upstream issue tracks Babel 8 and ast-types targets Babel 7.29.
2. Type-checking runs out of memory. Babel 8's `NodePath<T>` distributes over unions, so `NodePath` becomes a union of every node path. Our helpers intersect and narrow it (e.g. `SelectablePath`), which explodes. Fixing it means reworking how we type paths across most of `src/ast/`.
3. A few AST shapes changed (e.g. `TSTypeParameter.name` is now an `Identifier`) and the `minimal` pipeline operator proposal was dropped. After switching the parser to the `fsharp` proposal, 54 tests still failed across 9 files.

Babel 7 is still maintained: 7.x patches were published after Babel 8 came out.

## Decision

We stay on Babel 7 for now. Dependabot ignores Babel 8 for these 3 packages.

We'll reconsider when either:

- ast-types/recast support the Babel 8 AST, or
- Babel 7 stops getting patch releases

## Consequences

- No upgrade work until the ecosystem catches up
- We keep receiving Babel 7 security and bug fixes through Dependabot
- When we upgrade, expect to rework our `NodePath` typings first: TypeScript won't even finish type-checking until then

<!-- Links -->

[recast]: https://github.com/benjamn/recast
[ast-types]: https://github.com/benjamn/ast-types
