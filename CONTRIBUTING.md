# Contributing to Abracadabra

Architecture decisions for this project [are documented here][adrs], using the [Architecture Decision Records (ADR)][adrs-pattern] pattern.

## Tests

### Unit tests

We test business logic in isolation from VS Code API. These tests are located along source code—basically, all tests that are not in the `integration-tests/` folder.

These tests use [jest][jest].

### About VS Code integration tests

**TL;DR: we don't have integration tests.**

VS Code has documented [how to test an extension][testing-extension] in integration with VS Code API.

> These tests will run inside a special instance of VS Code named the `Extension Development Host`, and have full access to the VS Code API.

The problem here is that VS Code is using [mocha][mocha] by default. Which means we end up with type conflict between mocha & jest declarations!

A solution would be to develop a custom test runner using Jest, but it's not trivial. We didn't succeed in creating one that works yet.

Also, the need for integration test should be fairly small if we isolate our domain properly. We should mostly rely on unit tests (e.g. state-based tests, collaboration tests and contract tests).

## Code Style

Style formatting is managed by [Prettier][prettier]. It runs as a pre-commit hook, so you shouldn't have to worry about it 👐

There a few conventions that we'd like to keep consistent and are not automatically enforced yet.

### Structure of TS files

We structure TS files like this:

```ts
// 1. Imports from external libs
import { parse } from "@babel/parser";

// 2. Imports from local files
import { Selection } from "./selection";
import { Position } from "./position";

// 3. Exports
export { isStringLiteral, isClassDeclaration };
export { StringLiteral };

// 4. Rest of the code
function isStringLiteral() {
  // …
}
```

As a general rule, we prefer to have **what is exposed appear before what is private**. That's why we list the exports at the top of the file. We find it simpler to see what is exposed from a file, so it's easier to decide if that's too much and we should split.

<!-- Links -->

[testing-extension]: https://code.visualstudio.com/api/working-with-extensions/testing-extension
[mocha]: https://mochajs.org/
[jest]: https://jestjs.io/
[prettier]: https://prettier.io
[adrs-pattern]: http://thinkrelevance.com/blog/2011/11/15/documenting-architecture-decisions
[adrs]: https://github.com/nicoespeon/abracadabra/blob/master/docs/adr
