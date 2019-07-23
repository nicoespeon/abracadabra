# 🧙‍ Abracadabra

![][logo-abracadabra]

[![Build Status](https://travis-ci.org/nicoespeon/abracadabra.svg?branch=master)](https://travis-ci.org/nicoespeon/abracadabra)
![](https://img.shields.io/badge/it%27s-magic-purple.svg)

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
1. [Add Braces to Arrow Function](#add-braces-to-arrow-function)
1. [Remove Braces from Arrow Function](#remove-braces-from-arrow-function)

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

_Move Statement Up_ and _Move Statement Down_ also work on object properties. They always produce valid code, so **you don't have to bother with the trailing comma anymore**!

![][demo-move-statement-object-property]

### Add Braces to Arrow Function

> 💡 Available as Quick Fix

Useful when you need to add code in the body of an arrow function.

VS Code provides this refactoring, but it only works if you have the correct selection. This one works wherever your cursor is!

![][demo-add-braces-to-arrow-function]

### Remove Braces from Arrow Function

> 💡 Available as Quick Fix

Does the contrary of _Add Braces to Arrow Function_. Same advantages over VS Code: it works wherever your cursor is.

![][demo-remove-braces-from-arrow-function]

## Release Notes

[Have a look at our CHANGELOG][changelog] to get the details of all changes between versions.

### Versioning

We follow [SemVer][semver] convention for versionning.

That means our releases use the following format:

```
<major>.<minor>.<patch>
```

- Breaking changes bump `<major>` (and reset `<minor>` & `<patch>`)
- Backward compatible changes bump `<minor>` (and reset `<patch>`)
- Bug fixes bump `<patch>`

## Contributing

### [Contributing Guide][contributing]

Read our [contributing guide][contributing] to learn about our development process, how to propose bugfixes and improvements, and how to build and test your changes to Abracadabra.

### [Good First Issues][good-first-issues]

To help you get your feet wet and become familiar with our contribution process, we have a list of [good first issues][good-first-issues] that contains things with a relatively limited scope. This is a great place to get started!

## Contributors ✨

Thanks goes to these wonderful people ([emoji key][all-contributors-emoji]):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
<table><tr><td align="center"><a href="https://nicoespeon.com"><img src="https://avatars.githubusercontent.com/u/1094774?v=3" width="100px;" alt="Nicolas Carlo"/><br /><sub><b>Nicolas Carlo</b></sub></a><br /><a href="#question-nicoespeon" title="Answering Questions">💬</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=nicoespeon" title="Code">💻</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=nicoespeon" title="Documentation">📖</a><br /><a href="#review-nicoespeon" title="Reviewed Pull Requests">👀</a> <a href="#ideas-nicoespeon" title="Ideas">🤔</a></td><td align="center"><a href="https://fabien0102.com/"><img src="https://avatars.githubusercontent.com/u/1761469?v=3" width="100px;" alt="Fabien Bernard"/><br /><sub><b>Fabien Bernard</b></sub></a><br /><a href="#ideas-fabien0102" title="Ideas">🤔</a> <a href="#design-fabien0102" title="Design">🎨</a></td></tr></table>

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors][all-contributors] specification.

Contributions of any kind are welcome!

## Alternatives

### VS Code native refactorings

VS Code ships with [basic refactoring operations][vscode-refactorings].

Pros of Abracadabra over these:

- VS Code refactorings require you to select the code exactly. You can trigger Abracadabra as long as your cursor is in the scope, which is simpler and faster.
- Abracadabra proposes more refactorings than the VS Code default ones.
- Abracadabra refactorings are documented.
- You can assign a shortcut to every Abracadabra refactoring.

Cons of Abracadabra over these:

- Abracadabra refactorings won't be as native as VS Code ones.
- Abracadabra refactorings are limited to JS, TS, JSX and TSX.

### JS Refactor

The most popular extension for JavaScript refactoring is called [JS Refactor][js-refactor]. It provides JS automated refactorings for VS Code.

Pros of Abracadabra over these:

- Abracadabra work with TypeScript.
- Abracadabra proposes refactorings that JS Refactor doesn't.
- JS Refactor refactorings will work even with partially selected code. Abracadabra ones will also work as long as your cursor is in the scope.
- Abracadabra refactorings require you less steps to perform. It's faster to use.

Cons of Abracadabra over these:

- Abracadabra refactorings are more opinionated. This makes them faster to use, but might not cover some use cases.
- JS Refactor proposes code snippets, Abracadabra doesn't.
- JS Refactor supports Vue single file components and HTML.

---

![](https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/magic.gif?raw=true)

## License

💁 [MIT][license]

<!-- Links -->

[command-palette]: https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette
[change-keybindings]: https://code.visualstudio.com/docs/getstarted/keybindings
[vscode-refactorings]: https://code.visualstudio.com/docs/editor/refactoring
[vscode-quick-fixes]: https://code.visualstudio.com/docs/editor/refactoring#_code-actions-quick-fixes-and-refactorings
[vscode-rename-symbol]: https://code.visualstudio.com/docs/editor/refactoring#_rename-symbol
[js-refactor]: https://marketplace.visualstudio.com/items?itemName=cmstead.jsrefactor
[changelog]: https://github.com/nicoespeon/abracadabra/blob/master/CHANGELOG.md
[contributing]: https://github.com/nicoespeon/abracadabra/blob/master/CONTRIBUTING.md
[license]: https://github.com/nicoespeon/abracadabra/blob/master/LICENSE.md
[good-first-issues]: https://github.com/nicoespeon/abracadabra/issues?q=is%3Aissue+is%3Aopen+label%3A%22%3Awave%3A+Good+first+issue%22
[replace-nested-conditional-with-guard-clauses]: https://refactoring.guru/replace-nested-conditional-with-guard-clauses
[semver]: http://semver.org/
[all-contributors]: https://allcontributors.org
[all-contributors-emoji]: https://allcontributors.org/docs/en/emoji-key

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
[demo-add-braces-to-arrow-function]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/add-braces-to-arrow-function.gif?raw=true
[demo-remove-braces-from-arrow-function]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/remove-braces-from-arrow-function.gif?raw=true
[demo-move-statement-object-property]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/move-statement-object-property.gif?raw=true

<!-- Logo -->

[logo-abracadabra]: https://github.com/nicoespeon/abracadabra/blob/master/docs/logo/abracadabra-logo.png?raw=true
