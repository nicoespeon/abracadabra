# 16. Remove custom testeach

Date: 2025-11-06

## Status

Accepted

Supercedes [5. Use custom testEach instead of jest it.each](0005-use-custom-testeach-instead-of-jest-it-each.md)

## Context

The custom `testEach()` helper served well, but it doesn't work nicely with tools such as [Wallaby.js][wallaby]. Specifically, it makes it hard to focus and debug a single test.

Over time, we experimented with different approaches and found a better option.

## Decision

No more `testEach()` or `test.each()`. Stick with basic `it()`: one per test.

To avoid duplication, the _body_ of the test can be extracted in a function.

## Consequences

- Tests will be a bit more verbose
- Fewer magic, tests code is more consistent and compatible with any tooling
- Easier to debug a single test with Wallaby.js

<!-- Links -->

[wallaby]: https://wallabyjs.com/
