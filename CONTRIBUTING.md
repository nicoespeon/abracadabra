# Contributing to Refactorix

## Tests

### Integration tests

Tests present in `integration-tests/` folder are **integration tests**.

VS Code has documented [how to test an extension][testing-extension] in integration with VS Code API.

> These tests will run inside a special instance of VS Code named the `Extension Development Host`, and have full access to the VS Code API.

These tests use [mocha][mocha], following VS Code recommendation.

### Unit tests

We test business logic in isolation from VS Code API. These tests are located along source code.

[testing-extension]: https://code.visualstudio.com/api/working-with-extensions/testing-extension
[mocha]: https://mochajs.org/
