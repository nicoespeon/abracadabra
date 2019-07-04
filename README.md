# 🧙‍ Abracadabra

![][logo-abracadabra]

![](https://img.shields.io/badge/it%27s-magic-purple.svg)

> 👷 This project is under initial development phase and is not stable yet.

Abracadabra is a Visual Studio Code extension that brings you automated refactorings for JavaScript and TypeScript.

Our goal is to provide you with easy-to-use, intuitive refactorings. They help you clean the code and understand what's going on.

![Gif showing refactoring operations this extension can do][demo-extension]

## Installation

1. Click on the Extensions icon (usually on the left-hand side of your editor).
1. Search for "Abracadabra".
1. Find the extension in the list and click the install button.

## Available refactorings

All refactorings are available through the [Command Palette][command-palette].

![][demo-command-palette]

Some refactorings have default keybindings configured, but [you can change that][change-keybindings].

Refactorings that don't have default keybindings are available through [VS Code Quick Fixes][vscode-quick-fixes]. You usually access them by clicking on the lightbulb that appear next to the code 💡

**We recommend you** to use the official shortcut (e.g. `⌘ .` on Mac), or to define a custom one (like `Alt + ↵`).

1. [Rename Symbol](#rename-symbol)
1. [Extract Variable](#extract-variable)
1. [Inline Variable](#inline-variable)
1. [Negate Expression](#negate-expression)
1. [Remove Redundant Else](#remove-redundant-else)
1. [Flip If/Else](#flip-ifelse)
1. [Flip Ternary](#flip-ternary)
1. [Convert If/Else to Ternary](#convert-ifelse-to-ternary)
1. [Convert Ternary to If/Else](#convert-ternary-to-ifelse)
1. [Move Statement Up](#move-statement-up)
1. [Move Statement Down](#move-statement-down)

### Rename Symbol

| Keybinding (VS Code internal) |
| :---------------------------- |
| `F2`                          |

> A `Symbol` is typically a variable or a function name.

This refactoring allows you to rename things and make sure all references in your code follow! It's easier and safer to use than a classic "Find and Replace".

[VS Code does this refactoring][vscode-rename-symbol] very well. That's why this refactoring is merely an alias. It delegates the work to VS Code.

### Extract Variable

| Keybinding       | On Mac  |
| :--------------- | :------ |
| `Ctrl + Alt + V` | `⌥ ⌘ V` |

This refactoring helps you give a meaning to the hardcoded constants and low-level expressions. It makes your source code easier to read and maintain.

![][demo-extract-variable]

It will extract the closest element from your cursor or partial selection.

![][demo-extract-variable-partial]

### Inline Variable

| Keybinding       | On Mac  |
| :--------------- | :------ |
| `Ctrl + Alt + N` | `⌥ ⌘ N` |

This refactoring is the opposite of _Extract Variable_. It replaces a redundant usage of a variable or a constant with its initializer. It's usually helpful to inline things so you can extract them differently.

![][demo-inline-variable]

### Negate Expression

> 💡 Available as Quick Fix

Negates the logical expression while preserving behaviour. It can be useful to tweak a logical expression before extracting meaningful chunks out of it.

![][demo-negate-expression]

It will negate the closest expression from your cursor or partial selection.

![][demo-negate-expression-partial]

### Remove Redundant Else

> 💡 Available as Quick Fix

Removes the `else` keyword when it's not necessary, resulting in less nested code. This refactoring helps you [replace nested conditional with guard clauses][replace-nested-conditional-with-guard-clauses] to make your code easier to read.

![][demo-remove-redundant-else]

### Flip If/Else

> 💡 Available as Quick Fix

Flip the `if` and `else` statements. It's a useful refactoring to have in your toolbelt to simplify logical expressions.

![][demo-flip-if-else]

### Flip Ternary

> 💡 Available as Quick Fix

Flip a ternary statement. It's really similar to _Flip If/Else_ refactoring.

![][demo-flip-ternary]

### Convert If/Else to Ternary

> 💡 Available as Quick Fix

Convert an if/else statement into a (shorter) ternary expression. This is very handy to improve code readability.

![][demo-convert-if-else-to-ternary]

### Convert Ternary to If/Else

> 💡 Available as Quick Fix

Convert a ternary expression into an if/else statement. It reverses _Convert If/Else to Ternary_ refactoring.

![][demo-convert-ternary-to-if-else]

### Move Statement Up

| Keybinding          | On Mac  |
| :------------------ | :------ |
| `Ctrl + Shift + Up` | `⌘ ⇧ ↑` |

> A `Statement` is typically a variable or a function declaration.

Move the whole selected statement up. If the selected statement and the one above are one-liners, this is the same as doing VS Code _Move Line Up_. But if one of these statements is multi-lines, this refactoring is very handy!

As for all refactorings, it works even if you partially select the statement, or if the cursor is on the statement.

![][demo-move-statement-up]

### Move Statement Down

| Keybinding            | On Mac  |
| :-------------------- | :------ |
| `Ctrl + Shift + Down` | `⌘ ⇧ ↓` |

Same as _Move Statement Up_, but it moves the selected statement down. Like, the other direction. That's it.

![][demo-move-statement-down]

## Known Issues

### Code was formatted when I did a refactoring!?

Some refactorings reformat the code around the one that is modified.

This is because we use babel to parse code into AST, then we modify the AST and we regenerate the code from it. The regenerated code is formatted by babel, and the current way we update the source code applies the new formatting to more code than we'd like.

We've some leads in mind to fix that. It's obviously not a behaviour we want to keep for v1.

### The result of "XXX" refactoring is broken!!

Because there are many possible patterns in the wild, it's very likely we have missed some. _Extract Variable_ is a typical refactoring that may not work as expected in a specific situation.

When that happens, please [open a new issue][open-issue]. That way we can add test this pattern and fix it for good 🤓

We hope to progressively cover more and more use-cases. We won't consider the extension ready for v1 until we're confident about the robustness of the proposed refactorings!

## Release Notes

See the [Changelog][changelog] for the list of all notable changes.

## Alternatives

VS Code ships with [basic refactoring operations][vscode-refactorings]. But they tend to be limited and we didn't found the UX to be very intuitive.

There is also an extension called [JS Refactor][js-refactor] that provides JS automated refactorings for VS Code. But we didn't like its UX much (e.g. it takes a lot of keystrokes to extract a variable). Also, it didn't support JS class syntax well, nor JSX, TS and TSX when we decided to create **Abracadabra**.

![](https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/magic.gif?raw=true)

<!-- Links -->

[command-palette]: https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette
[change-keybindings]: https://code.visualstudio.com/docs/getstarted/keybindings
[vscode-refactorings]: https://code.visualstudio.com/docs/editor/refactoring
[vscode-quick-fixes]: https://code.visualstudio.com/docs/editor/refactoring#_code-actions-quick-fixes-and-refactorings
[vscode-rename-symbol]: https://code.visualstudio.com/docs/editor/refactoring#_rename-symbol
[js-refactor]: https://marketplace.visualstudio.com/items?itemName=cmstead.jsrefactor
[changelog]: https://github.com/nicoespeon/abracadabra/blob/master/CHANGELOG.md
[replace-nested-conditional-with-guard-clauses]: https://refactoring.guru/replace-nested-conditional-with-guard-clauses
[open-issue]: https://github.com/nicoespeon/abracadabra/issues/new

<!-- Demo images -->

[demo-extension]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/extension.gif?raw=true
[demo-command-palette]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/command-palette.png?raw=true
[demo-extract-variable]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/extract-variable.gif?raw=true
[demo-extract-variable-partial]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/extract-variable-partial.gif?raw=true
[demo-inline-variable]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/inline-variable.gif?raw=true
[demo-negate-expression]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/negate-expression.gif?raw=true
[demo-negate-expression-partial]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/negate-expression-partial.gif?raw=true
[demo-remove-redundant-else]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/remove-redundant-else.gif?raw=true
[demo-flip-if-else]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/flip-if-else.gif?raw=true
[demo-flip-ternary]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/flip-ternary.gif?raw=true
[demo-convert-if-else-to-ternary]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/convert-if-else-to-ternary.gif?raw=true
[demo-convert-ternary-to-if-else]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/convert-ternary-to-if-else.gif?raw=true
[demo-move-statement-up]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/move-statement-up.gif?raw=true
[demo-move-statement-down]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/move-statement-down.gif?raw=true

<!-- Logo -->

[logo-abracadabra]: https://github.com/nicoespeon/abracadabra/blob/master/docs/logo/abracadabra-logo.png?raw=true
