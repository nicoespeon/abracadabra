# 5. Use custom testEach instead of jest it.each

Date: 2019-07-14

## Status

Accepted

## Context

Jest [`it.each` seemed great][jest-it-each], but it turns out to be limited.

Specifically, it doesn't allow us to have a `.only` on a single test of the list.

Of course, this can be done at runtime through Jest runner. But if we use tools like [Wallaby.js][wallaby], we can't do that. We need a way to add things like `.only` on individual tests.

## Decision

We've decided to implement a custom `testEach()` function that will provide a convenient API to run the same test over different data.

This function will provide a way to run individual test of the list with `only: true`.

## Consequences

We'll be able to run only one test, even if it's a single data variation of a test. This way, it will be easier to implement new use-cases on existing refactorings, with whatever tool we want.

<!-- Links -->

[jest-it-each]: https://jestjs.io/docs/en/api#testeachtable-name-fn-timeout
[wallaby]: https://wallabyjs.com/
