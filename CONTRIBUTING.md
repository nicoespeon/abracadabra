# Contributing to Abracadabra

First of all, we'd like to thank you for taking some of your time to contribute to the project. You're awesome 🤠👍

Architecture decisions for this project [are documented here][adrs], using the [Architecture Decision Records (ADR)][adrs-pattern] pattern.

## Table of Contents

- [Getting started](#getting-started)
- [Run the tests](#run-the-tests)
  - [About tests](#about-tests)
  - [Running the contract tests](#runnig-the-contract-tests)
  - [Specificities of the InMemory editor](#specificities-of-the-inmemory-editor)
- [Create a new refactoring](#create-a-new-refactoring)
- [Useful resources to start changing the code](#useful-resources-to-start-changing-the-code)
- [Code Style](#code-style)
  - [Structure of TS files](#structure-of-ts-files)
- [Debug locally](#debug-locally)
- [Create a package and use it](#create-a-package-and-use-it)
- [Open a PR and add acknowledge your contribution](#open-a-pr-and-add-acknowledge-your-contribution)
- [Deploy a new version](#deploy-a-new-version)

## Getting started

> Pre-requisite: you have installed [git][install-git], [node][install-node] and [yarn][install-yarn].

1. Clone the repo: `git clone git@github.com:nicoespeon/abracadabra.git`
1. Go into the cloned repository: `cd abracadabra`
1. Install dependencies: `yarn install`

The project uses [TypeScript][typescript], [Jest][jest] for the tests and [Prettier][prettier] for the formatting.

## Run the tests

You can run unit tests with `yarn test`.

To run tests in watch mode, use `yarn test --watch`.

We use [Jest][jest] under the hood, so you can pass any valid Jest command to `yarn test`.

### About tests

We write 2 kind of tests:

1. **Unit Tests**
2. Integration Tests (we call them **Contract Tests**)

Now, people have different definitions of what a "unit" is and what "integration" tests are. So here's an explaination of how it works in _this_ project 🤠

Most of our tests are testing the business logic, isolated from VS Code API. It's pure logic and doesn't rely on a specific environment to run. That's what we call that "unit tests". Some would call them "integration tests" because we don't mock much. Others would call that [sociable unit tests](https://martinfowler.com/bliki/UnitTest.html). **What really matters is that they are reliable, fast, and don't test implementation details.**

To make this possible, we're using an `InMemoryEditor` implementation that behaves as expected. To ensure it behaves as expected, we have written contract tests. These same tests will run against the `VSCodeEditor` implementation, ensuring we can replace one with the other. These contract tests are what we'd call "integration tests". But, we simply call them contract tests.

Here's a little schema to illustrate how it works:

![][how-tests-work]

[_Too small to read? Check the SVG 👍_][how-tests-work-svg]

### Running the contract tests

You can run the contract tests with `yarn test:contract`.

It's a distinct command because these tests are slower. They will integrate with VS Code API to actually do changes in a playground environment. Hopefully, we don't need to run them often—not until we have to change editors' behavior.

VS Code has a limitation. It can't launch tests that access VS Code API while another instance of the editor is running.

Thus, there are 2 ways to actually launch the tests:

1. Use [VS Code Insiders](https://code.visualstudio.com/insiders/), which has less restrictions, but is riskier to use—it has the most recent code pushes and may lead to the occasional broken build.
2. Lauch tests through the VS Code debugger. We created a dedicated task you can launch. It will compile the code, open a playground editor and run the tests inside.

![Run contract tests from the debugger, or use F5][contract-tests-debugger]

The test report is available in the `Debug Console`.

![][contract-tests-report]

**Finally, both unit & contract tests are run in CI**. If you open a PR and CI is green, then you know everything is fine and you did an amazing job ✅

### Specificities of the InMemory editor

On top of expected editor behaviors, the InMemory editor has convenient features that makes tests easier to write:

- `[start]` and `[end]` are parsed as if it was the selection of the user
- `[cursor]` is parsed as if it was the cursor of the user (the cursor really is an empty selection, so that's a shorthand for `[start][end]`)

Have a look at existing tests, you'll see that this leads to very easy to read specifications.

## Create a new refactoring

Run `yarn new` and follow the tool, it will ask you the relevant questions.

[We've documented the context of this decision in this ADR][adr-create-generator].

If you want to change how code scaffolding works, check [hygen documentation][hygen-documentation].

You will also need to add the new refactoring to the lists in `package.json` and `src/extension.ts`. These lists should be kept in alphabetical order.

## Useful resources to start changing the code

- [VS Code Extension API documentation][vscode-extension-docs] is a good start
- [AST Explorer][ast-explorer] is a very handy tool to explore the AST. Use `babylon-7` parser.
- As we use Babel to transform the AST, [the handbook][babel-handbook] is very useful. In particular [the transformation][babel-handbook-transformation] and [the manipulation][babel-handbook-manipulation] parts.

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

// 3. Rest of the code, starting with high-level concepts
export function statementWithBraces(node: t.Statement): t.Statement {
  return isBlockStatement(node) ? node : blockStatement([node]);
}

function isBlockStatement() {}
function blockStatement() {}
```

As a general rule, we prefer to have **what is exposed appear before what is private**. We like to read the high-level concepts before the implementation details.

## Debug locally

You can use [VS Code's built-in debugger][vscode-debug-extension] on the project to test the extension.

To build the project, press `F5`.

_Note: if pressing `F5` runs the "Contract Tests", please select the "Run Extension" task instead and press `F5` again._

![][debugger-build]

It will open an "Extension Development Host" window, overriding your "Abracadabra" extension with your local code. This is helpful to test your changes in integration with VS Code API.

![][extension-development-host]

If you do changes, rebuild the project by clicking on the reload icon.

![][debugger-rebuild]

While debugging the extension is helpful to see changes in action, you can use the unit tests to develop without having to rebuild the project at every change.

## Create a package and use it

To create a package from your local code, run `yarn package`.

When it's done, run `yarn package:install` to install this new version instead of the one you had.

This allows you to use the package before it's published to the MarketPlace.

## Open a PR and add acknowledge your contribution

You can open a Pull-Request at any time. It can even be a draft if you need to ask for guidance and help. Actually, we'd be pretty happy to assist you going in the best direction!

Once everything is ready, open a Pull-Request (if it's not already done) and ask for a review. We'll do our best to review it asap.

Finally, [use all-contributors bot command][all-contributors-bot-command] to add yourself to the list of contributors. It's very easy to do, you basically need to mention the bot in a comment of your PR.

Whether it's code, design, typo or documentation, every contribution is welcomed! So again, thank you very, very much 🧙‍

## Deploy a new version

Usually, @nicoespeon will deploy new versions of Abracadabra. Here are the necessary steps documented, in case you need to do it (or he forgots how to).

Hopefully, most of the steps are automated already!

1. Check that tests are passing (`yarn test:ci`) and package can be built (`yarn build`). CI is automatically running against all Pull-Requests to ensure this is always true. Also, the new version won't be deployed if CI doesn't pass anyway.
2. Bump the version in the `package.json` following [SemVer][semver].
3. If it's a minor or major bump, choose a release name (no rule here, have fun). Update the Changelog accordingly.
4. Commit all of these changes directly on the main branch, like this: [5.3.0](https://github.com/nicoespeon/abracadabra/commit/652611df41256fb1fd58704b121956154859a13d)
5. [Create a new release](https://github.com/nicoespeon/abracadabra/releases/new) targeting the main branch. Use the release name as a title and changelog body as a description.

That's it. [A GitHub Action](https://github.com/nicoespeon/abracadabra/actions) will kick in and publish the new release to all marketplaces. @nicoespeon should receive an email when everything is done.

<!-- Links -->

[jest]: https://jestjs.io/
[typescript]: https://www.typescriptlang.org/
[prettier]: https://prettier.io
[ast-explorer]: https://astexplorer.net/
[adrs-pattern]: http://thinkrelevance.com/blog/2011/11/15/documenting-architecture-decisions
[install-git]: https://git-scm.com/book/en/v2/Getting-Started-Installing-Git
[install-node]: https://nodejs.org/en/download/
[install-yarn]: https://yarnpkg.com/lang/en/docs/install/
[vscode-extension-docs]: https://code.visualstudio.com/api
[vscode-debug-extension]: https://code.visualstudio.com/api/get-started/your-first-extension#debugging-the-extension
[babel-handbook]: https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md
[babel-handbook-transformation]: https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md#toc-transformation-operations
[babel-handbook-manipulation]: https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md#manipulation
[all-contributors-bot-command]: https://allcontributors.org/docs/en/bot/usage#all-contributors-add
[hygen-documentation]: https://www.hygen.io/docs/quick-start
[semver]: http://semver.org/

<!-- Repo links -->

[adrs]: https://github.com/nicoespeon/abracadabra/blob/main/docs/adr
[adr-create-generator]: https://github.com/nicoespeon/abracadabra/blob/main/docs/adr/0006-create-generator-to-bootstrap-new-refactorings.md

<!-- Images -->

[debugger-build]: https://github.com/nicoespeon/abracadabra/blob/main/docs/contributing/debugger-build.png?raw=true
[extension-development-host]: https://github.com/nicoespeon/abracadabra/blob/main/docs/contributing/extension-development-host.png?raw=true
[debugger-rebuild]: https://github.com/nicoespeon/abracadabra/blob/main/docs/contributing/debugger-rebuild.png?raw=true
[how-tests-work]: https://github.com/nicoespeon/abracadabra/blob/main/docs/contributing/how-tests-work.png?raw=true
[how-tests-work-svg]: https://github.com/nicoespeon/abracadabra/blob/main/docs/contributing/how-tests-work.svg?raw=true
[contract-tests-debugger]: https://github.com/nicoespeon/abracadabra/blob/main/docs/contributing/contract-tests-debugger.png?raw=true
[contract-tests-report]: https://github.com/nicoespeon/abracadabra/blob/main/docs/contributing/contract-tests-report.png?raw=true
