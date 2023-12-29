# 15. Use esbuild to build instead of webpack

Date: 2023-12-29

## Status

Accepted

Supercedes [11. Use babel-jest instead of ts-jest](0011-use-babel-jest-instead-of-ts-jest.md)

## Context

Building Abracadabra takes ~75s. It is an acceptable time for CI, but it's slowing down development when you want to debug the extension locally: you need to wait ~1 minute between each change for the extension to reload.

Back in 2022, we already tried to use a faster compiler for the project, but it had a lot of issues:

> The recommended solution was to use a compiler that would not care about types, like Babel, SWC (in Rust), or ESBuild (in Go). But we got issues with SWC and ESBuild, they throw errors when trying to compile the project. We feel they are not mature enough yet to be used for this project.

However, [@j4k0xb](https://github.com/j4k0xb) managed to get ESBuild to work fine!

This is interesting because ESBuild is sensibly faster than webpack:

- https://esbuild.github.io/faq/#benchmark-details
- https://esbuild.github.io/faq/#why-is-esbuild-fast

## Decision

We will be using ESBuild instead of Webpack to compile Abracadabra. Kudos to [@j4k0xb](https://github.com/j4k0xb)!

We also turned on `incremental` builds in the TypeScript config.

## Consequences

Overall, all the build commands are **much** faster now:

| Command                               | Before | After |
| ------------------------------------- | ------ | ----- |
| yarn build                            | 23s    | 0.6s  |
| yarn build:node                       | 17s    | 0.4s  |
| yarn build:browser                    | 17s    | 0.4s  |
| yarn pretest:contract                 | 14s    | 0.8s  |
| yarn typecheck (incremental tsconfig) | 14s    | 1s    |

It results in a much more pleasant development experience when pressing F5: 0.6s instead of 23s (or more, depending on your machine).

To analyze the bundle, we simply need to drop the generated `meta-*.json` files in https://esbuild.github.io/analyze/

Finally, it also requires fewer libraries to install since ESBuild already contains a lot of the dependencies we used to require (e.g. assert, process, util…).
