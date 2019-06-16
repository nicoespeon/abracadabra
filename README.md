# 🧙‍ Abracadabra

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

Refactorings that don't have default keybindings are available through [VS Code Quick Fixes][vscode-quick-fixes]. You usually access them by clicking on the lightbulb that appear next to the code 💡 We recommend you to use the official shortcut (e.g. `⌘ .` on Mac), or to define a custom one (like `Alt + ↵`).

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

This refactoring negates the logical expression while preserving behaviour. It can be useful to tweak a logical expression before extracting meaningful chunks out of it.

![][demo-negate-expression]

It will negate the closest expression from your cursor or partial selection.

![][demo-negate-expression-partial]

## Known Issues

🌈 None at the moment.

## Release Notes

See the [Changelog][changelog] for the list of all notable changes.

## Alternatives

VS Code ships with [basic refactoring operations][vscode-refactorings]. But they tend to be limited and we didn't found the UX to be very intuitive.

There is also an extension called [JS Refactor][js-refactor] that provides JS automated refactorings for VS Code. But we didn't like its UX much (e.g. it takes a lot of keystrokes to extract a variable). Also, it didn't support JS class syntax well, nor JSX, TS and TSX when we decided to create **Abracadabra**.

<!-- Links -->

[command-palette]: https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette
[change-keybindings]: https://code.visualstudio.com/docs/getstarted/keybindings
[vscode-refactorings]: https://code.visualstudio.com/docs/editor/refactoring
[vscode-quick-fixes]: https://code.visualstudio.com/docs/editor/refactoring#_code-actions-quick-fixes-and-refactorings
[vscode-rename-symbol]: https://code.visualstudio.com/docs/editor/refactoring#_rename-symbol
[js-refactor]: https://marketplace.visualstudio.com/items?itemName=cmstead.jsrefactor
[changelog]: https://github.com/nicoespeon/abracadabra/blob/master/CHANGELOG.md

<!-- Demo images -->

[demo-extension]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/extension.gif?raw=true
[demo-command-palette]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/command-palette.png?raw=true
[demo-extract-variable]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/extract-variable.gif?raw=true
[demo-extract-variable-partial]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/extract-variable-partial.gif?raw=true
[demo-inline-variable]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/inline-variable.gif?raw=true
[demo-negate-expression]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/negate-expression.gif?raw=true
[demo-negate-expression-partial]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/negate-expression-partial.gif?raw=true
