# 17. Use Vitest instead of Jest

Date: 2026-10-01

## Status

Accepted

Supercedes [11. Use babel-jest instead of ts-jest](0011-use-babel-jest-instead-of-ts-jest.md)

## Context

More and more of our dependencies only ship ES modules: jsdom 30 pulls a dozen of them, and Babel 8 (parser, traverse, types) is ESM-only.

Jest runs tests through its own CommonJS module system. It can't load these packages, even on a Node version that supports `require()` of ES modules. Making Babel transpile them from `node_modules` is brittle (nested packages, `.mjs` files) and made the test suite ~4x slower.

[Vitest][vitest] loads ES modules natively and runs TypeScript without type-checking, like babel-jest did. Its API is close to Jest's: we only had to change a handful of `jest.fn()`/`jest.spyOn()` calls.

## Decision

Unit tests run with Vitest. Globals (`describe`, `it`, `expect`, `vi`) are enabled so test files don't need imports.

Test files are not isolated from each other (`isolate: false`): workers are reused across files instead of spawning one per file. It makes the suite ~3x faster.

Babel is no longer used to compile tests, so we dropped `@babel/core` and its presets.

## Consequences

- We can upgrade ESM-only dependencies again
- Fewer dev dependencies and no Babel config to maintain
- The full test suite runs in ~3s, against ~10s with Jest
- Test files share module state. Tests must not mutate module-level variables, nor spy on or mock modules without restoring them. Otherwise, unrelated tests may fail depending on the order they run
- Type errors still don't fail tests: CI checks them with `yarn typecheck`
- Wallaby.js supports Vitest

<!-- Links -->

[vitest]: https://vitest.dev/
