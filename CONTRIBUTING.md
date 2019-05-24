# Contributing to Refactorix

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

[testing-extension]: https://code.visualstudio.com/api/working-with-extensions/testing-extension
[mocha]: https://mochajs.org/
[jest]: https://jestjs.io/
