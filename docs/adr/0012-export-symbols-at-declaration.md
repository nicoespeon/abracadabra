# 12. Export symbols at declaration

Date: 2022-02-14

## Status

Accepted

## Context

We used to put the exported symbols at the top of each file. The idea was that it would be easier to see what's exported from each file at a glance.

However, that doesn't work well with types since [we started using babel for running tests](./0011-use-babel-jest-instead-of-ts-jest.md). That created inconsistencies with some symbols being exported at the top of the file, and types being exported where they are declared.

That got me to reflect on exporting symbols at the top of the file. While the idea was to clarify what's the public API of each file, it's _not_ the most frequent question I have when working with the code. TypeScript is already providing auto-completion and auto-imports the symbols we need to use. However, having the exports far from the declaration made it harder to answer the question: "is this symbol exported?".

Consistency and being able to tell if the symbol we are looking at is exported outweigh the simplicity of seeing what a given file exports.

## Decision

The `export` keyword is used on the declaration of the symbol, as much as possible

## Consequences

Before:

```ts
export { doThis, doThat };

function doThis() {}
function doThat() {}
```

Now:

```ts
export function doThis() {}
export function doThat() {}
```

The pros:

- Easier to tell if a given symbol is exported
- No more inconsistency with types that have to be exported where they are declared
- No more inconsistency when we want to export a `const` (they had to be declared _before_ the export)

The cons:

- Harder to tell what is being exported from a file. That's fine because TS helps with auto-import/complete. Also, folding everything make it quite easy to detect the exported symbols.
