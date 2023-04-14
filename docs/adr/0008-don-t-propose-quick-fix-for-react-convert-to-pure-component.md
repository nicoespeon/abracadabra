# 8. Don't propose Quick Fix for React Convert to Pure Component

Date: 2020-03-27

## Status

Accepted

Amended by [13. Remove Extract Class and Convert to Pure Component refactorings](0013-remove-extract-class-and-convert-to-pure-component-refactorings.md)

## Context

After analysing performances of the extension on a big JavaScript file, [we noticed][comment] the "Convert to Pure Component" Quick Fix took most of the time:

![][flame-chart]

This refactoring can only be applied under specific circumstances. It doesn't worth the toll for everyone, on every trigger.

Also, there's nothing we can do to improve the performance of this refactoring. The code is implemented by [react-codemod](https://github.com/reactjs/react-codemod). It was originally meant to be run through a CLI command.

## Decision

We will stop proposing a Quick Fix for this refactoring.

## Consequences

The extension will become much more performant in the background.

It will still be possible to run the refactoring using the Command Palette.

<!-- Links -->

[comment]: https://github.com/nicoespeon/abracadabra/pull/82#issuecomment-605381510
[flame-chart]: https://github.com/nicoespeon/abracadabra/blob/main/docs/adr/assets/0008-flame-chart.png?raw=true
