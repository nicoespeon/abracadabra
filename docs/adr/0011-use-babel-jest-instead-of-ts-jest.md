# 11. Use babel-jest instead of ts-jest

Date: 2022-02-02

## Status

Superceded by [15. Use esbuild to build instead of webpack](0015-use-esbuild-to-build-instead-of-webpack.md)

## Context

Running the unit tests was taking way too long, slowing down the development beyond what's reasonable. Running 1.116 tests would take more than 1 minute, which is more than 50ms per test. Such tests should take ~1ms per test to run.

[Wallaby.js](https://wallabyjs.com/) became unusable when developing, motivating the decision to invest some time to speed up the whole thing.

Turns out the Wallaby.js team wrote [a blog post explaining the situation](https://wallabyjs.com/blog/optimizing-typescript.html). In short:

> Wallaby creates multiple worker processes, and in each worker process, Jest creates a separate instance of the TypeScript compiler and compiles your entire project again.

The numbers here are very relatable. They are using the same stack (Jest + ts-jest) on a project of a similar size (22kLoC and 135 files, Abracadabra is 24kLoC and 200 files today).

With `ts-jest`, each test would compile the TypeScript source considering the types, which is naturally slow.

The recommended solution was to use a compiler that would not care about types, like Babel, SWC (in Rust), or ESBuild (in Go). But we got issues with SWC and ESBuild, they throw errors when trying to compile the project. We feel they are not mature enough yet to be used for this project.

We had no issue running the tests with Babel though.

## Decision

Unit tests will compile the project with `babel-jest` instead of `ts-jest`.

## Consequences

- Running the whole test suite (without cache) used to take more than 1min. Now it takes ~6s. That's more than 10 times faster!
- Developers can use Wallaby.js again!
- Tests won't fail for type errors anymore (which is a pro, actually) (CI will check for type errors, so we are good)
- CI should run faster, even with running type checks as a first step

Note: building the project still uses TS + Webpack. It could probably be speed up, but speed of releases is not an issue today.
