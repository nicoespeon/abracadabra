# Refactorix

> 👷 This project is under initial development phase and is not stable yet.

Refactorix is a Visual Studio Code extension that brings you automated refactorings for JavaScript and TypeScript.

Our goal is to provide you with easy-to-use, intuitive refactorings. They help you clean the code and understand what's going on.

![Illustration of "Extract Variable" refactoring][demo-extract-variable-with-shortcut]

## Installation

1. Click on the Extensions icon (usually on the left-hand side of your editor).
1. Search for "Refactorix".
1. Find the extension in the list and click the install button.

## Available refactorings

All refactorings are available through the [Command Palette][command-palette].

![][demo-command-palette]

Some refactorings have default keybindings configured, but [you can change that][change-keybindings].

### Rename Symbol

A `Symbol` is typically a variable or a function name.

This refactoring allows you to rename things and make sure all references in your code follow! It's easier and safer to use than a classic "Find and Replace".

### Extract Variable

| Keybinding       | On Mac  |
| :--------------- | :------ |
| `Ctrl + Alt + V` | `⌥ ⌘ V` |

> 💡 Available as Quick Fix

This refactoring helps you give a meaning to the hardcoded constants and low-level expressions. It makes your source code easier to read and maintain.

Select the code you want to extract:

![][demo-extract-variable-with-lightbulb]

You don't have to select though. It will extract the closest element from your cursor or partial selection:

![][demo-extract-variable-with-shortcut]

### Inline Variable

| Keybinding       | On Mac  |
| :--------------- | :------ |
| `Ctrl + Alt + N` | `⌥ ⌘ N` |

This refactoring is the opposite of _Extract Variable_. It replaces a redundant usage of a variable or a constant with its initializer. It's usually helpful to inline things so you can extract them differently.

![][demo-inline-variable]

## Known Issues

🌈 None at the moment.

## Release Notes

See the [Changelog][changelog] for the list of all notable changes.

## Alternatives

VS Code ships with [basic refactoring operations][vscode-refactorings]. But they tend to be limited and we didn't found the UX to be very intuitive.

There is also an extension called [JS Refactor][js-refactor] that provides JS automated refactorings for VS Code. But we didn't like its UX much (e.g. it takes a lot of keystrokes to extract a variable). Also, it didn't support JS class syntax well, nor JSX, TS and TSX when we decided to create **Refactorix**.

<!-- Links -->

[command-palette]: https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette
[change-keybindings]: https://code.visualstudio.com/docs/getstarted/keybindings
[vscode-refactorings]: https://code.visualstudio.com/docs/editor/refactoring
[js-refactor]: https://marketplace.visualstudio.com/items?itemName=cmstead.jsrefactor
[changelog]: https://github.com/nicoespeon/refactorix/blob/master/CHANGELOG.md

<!-- Demo images -->

[demo-command-palette]: https://github.com/nicoespeon/refactorix/blob/master/docs/demo/command-palette.png?raw=true
[demo-extract-variable-with-lightbulb]: https://github.com/nicoespeon/refactorix/blob/master/docs/demo/extract-variable-with-lightbulb.gif?raw=true
[demo-extract-variable-with-shortcut]: https://github.com/nicoespeon/refactorix/blob/master/docs/demo/extract-variable-with-shortcut.gif?raw=true
[demo-inline-variable]: https://github.com/nicoespeon/refactorix/blob/master/docs/demo/inline-variable.gif?raw=true
