# 10. Integration tests

Date: 2021-01-21

## Status

Accepted

Supercedes [2. No integration test](0002-no-integration-test.md)

## Context

We had to enhance editor capabilities and implement new editor adapters with the latest features. Not having integration tests to cover these changes became more and more risky.

After giving it another try, we were able to get Jest & Mocha installed together, without compilation errors because of type conflicts. Therefore, it was possible to create integration tests that would have access to VS Code API.

## Decision

We will now cover adapters with integration tests.

Because _integration tests_ has different meanings for different people, we have decided to call them **contract tests** instead. Our intention is to test that all adapters of an interface do follow the same contract.

## Consequences

Contract tests will be run with a separate command than the unit ones.

Contract tests will be written using mocha API, whereas unit tests will be written using Jest API.

All adapters implementations will be run as contract tests, even the in-memory ones.

Contract tests will execute within a VS Code environment, to have access to its API.

Because of VS Code limitation, we won't be able to run contract tests from the terminal if VS Code is already open. To run these, we either need to:

- Close VS Code and run the tests from CLI
- Install VS Code Insiders and use it (limitation doesn't exist here)
- Run the launch task named "Contract Tests" that will execute tests in a sandbox environment. Test report can be find in the `Debug Console` tab.
