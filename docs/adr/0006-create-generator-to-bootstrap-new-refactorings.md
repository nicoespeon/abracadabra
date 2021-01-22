# 6. Create generator to bootstrap new refactorings

Date: 2019-08-11

## Status

Accepted

## Context

Creating a new refactoring kinda always follow the same steps. There is a bunch of boilerplate code that needs to be created.

We could try to refactor this boilerplate into some good abstraction. But we still need to scaffold the same files over and over: the refactoring file, the test file, the command declaration file and eventually the action provider one.

## Decision

To speed up this process, we've decided to use a code generator.

We went for [hygen](https://www.hygen.io/) because it's quite simple to use, very fast and flexible.

We're abstracting the usage of hygen behind a npm script alias: `yarn new` will ask you few questions to scaffold a new refactoring.

## Consequences

You can use `yarn new` to create a new refactoring.

Follow the tool, it will ask you the relevant questions.

If you want to contribute, check [hygen documentation](https://www.hygen.io/docs/quick-start) to learn how it works.
