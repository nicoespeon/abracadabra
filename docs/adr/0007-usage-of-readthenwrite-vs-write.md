# 7. Usage of `readThenWrite()` vs `write()`

Date: 2019-09-25

## Status

Accepted

## Context

We've implemented 2 different methods in the Editor interface:

1. `write()`
1. `readThenWrite()`

Most refactorings use `write()`. They create new code from the AST, then write it in the editor. Still, some refactorings use `readThenWrite()`: they first read some code `string` from the editor, and use it to write new code.

The main problem of `readThenWrite()` is that we end up manipulating strings instead of the AST. This usually means the implementation is more complex. Instead of manipulating the AST, we need to retrieve the correct selection we need to read, then we have to mix this read code with the transformation to produce the final output. Final code is less straightforward and more cases need to be tackled by us, instead of relying on the AST parser to do the job.

However, there is one key advantage of doing so: it absolutely preserve the code as it was written in the editor. Even though [we use recast to preserve code style as much as possible][recast-usage], it's not perfect. If the refactoring consist in re-using exactly code that was written, `readThenWrite()` is the only way we know to preserve exactly the original style.

## Decision

We'll use `readThenWrite()` if we need to preserve a code exactly as it was written. E.g. if the refactoring consists in moving existing code, without transforming it (Extract Variable, Inline Variable).

For other refactorings, we'll use `write()`. E.g. if the refactoring transforms the code, it's OK to change it while preserving the original style as much as possible with recast.

## Consequences

Refactorings using `readThenWrite()` are harder to maintain. But the result of the refactoring is what the end user would expect, without bad surprise.

[recast-usage]: ./0004-use-recast-for-ast-manipulation.md
