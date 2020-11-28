# 🧙‍ Abracadabra

> **Refactoring** (noun): a change made to the internal structure of software to make it easier to understand and cheaper to modify without changing its observable behavior.
>
> — _"Refactoring: Improving the Design of Existing Code" by Martin Fowler_

![][logo-abracadabra]

<!-- prettier-ignore-start -->
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-18-orange.svg?style=flat-square)](#contributors)
<!-- ALL-CONTRIBUTORS-BADGE:END -->
<!-- prettier-ignore-end -->

[![Build Status](https://travis-ci.org/nicoespeon/abracadabra.svg?branch=master)](https://travis-ci.org/nicoespeon/abracadabra)
![](https://img.shields.io/badge/it%27s-magic-purple.svg)

Abracadabra is a Visual Studio Code extension that brings you automated refactorings for JavaScript and TypeScript. Works in `.js`, `.jsx`, `.ts`, `.tsx` and `.vue` files.

Our goal is to provide you with easy-to-use, intuitive refactorings. They help you clean the code and understand what's going on.

Related projects:

- [Hocus Pocus][hocus-pocus], a VS Code extension that creates useful things for you, in JavaScript and TypeScript.

## Table of Contents

- [Installation](#installation)
- [Available refactorings](#available-refactorings)
  - The Essentials:
    1. [Rename Symbol](#rename-symbol)
    1. [Extract Variable](#extract-variable)
    1. [Extract Generic Type](#extract-generic-type)
    1. [Inline Variable](#inline-variable)
    1. [Inline Function](#inline-function)
    1. [Move Statement Up](#move-statement-up)
    1. [Move Statement Down](#move-statement-down)
  - Simplifying Conditional Logic:
    1. [Negate Expression](#negate-expression)
    1. [Remove Redundant Else](#remove-redundant-else)
    1. [Simplify Ternary](#simplify-ternary)
    1. [Flip If/Else](#flip-ifelse)
    1. [Flip Ternary](#flip-ternary)
    1. [Convert If/Else to Ternary](#convert-ifelse-to-ternary)
    1. [Convert Ternary to If/Else](#convert-ternary-to-ifelse)
    1. [Convert If/Else to Switch](#convert-ifelse-to-switch)
    1. [Convert Switch to If/Else](#convert-switch-to-ifelse)
    1. [Split If Statement](#split-if-statement)
    1. [Merge If Statements](#merge-if-statements)
    1. [Merge With Previous If Statement](#merge-with-previous-if-statement)
    1. [Lift Up Conditional](#lift-up-conditional)
  - Encapsulation:
    1. [Extract Class](#extract-class)
  - Moving Features:
    1. [Remove Dead Code](#remove-dead-code)
  - Organizing data:
    1. [Split Declaration and Initialization](#split-declaration-and-initialization)
    1. [Convert let to const](#convert-let-to-const)
  - Working around the syntax:
    1. [Convert to Arrow Function](#convert-to-arrow-function)
    1. [Add Braces to Arrow Function](#add-braces-to-arrow-function)
    1. [Remove Braces from Arrow Function](#remove-braces-from-arrow-function)
    1. [Add Braces to If Statement](#add-braces-to-if-statement)
    1. [Remove Braces from If Statement](#remove-braces-from-if-statement)
    1. [Convert to Template Literal](#convert-to-template-literal)
    1. [Replace Binary with Assignment](#replace-binary-with-assignment)
    1. [Convert For-Loop to Foreach](#convert-for-loop-to-foreach)
  - Specific to TypeScript:
    1. [Extract Interface](#extract-interface)
  - Specific to React:
    1. [Convert to Pure Component](#convert-to-pure-component)
    1. [Add braces to JSX attribute](#add-braces-to-jsx-attribute)
    1. [Remove braces from JSX attribute](#remove-braces-from-jsx-attribute)
- [Configuration](#configuration)
- [Release Notes](#release-notes)
  - [Versioning](#versioning)
- [Contributing](#contributing)
  - [Contributing Guide](#contributing-guide)
  - [Good First Issues](#good-first-issues)
- [Contributors](#contributors)
- [Alternatives](#alternatives)
- [License](#license)

## Installation

1. Click on the Extensions icon (usually on the left-hand side of your editor).
1. Search for "Abracadabra".
1. Find the extension in the list and click the install button.

## Available refactorings

All refactorings are available through the [Command Palette][command-palette].

![][demo-command-palette]

Some refactorings have default keybindings configured, but [you can change that][change-keybindings].

All other refactorings are available through [VS Code Quick Fixes][vscode-quick-fixes]. You can access them by clicking on the lightbulb that appear next to the code 💡 or use the default shortcut `Alt ↵`.

Pro Tip: You can also disable the Quick Fixes you never use in [VS Code settings][vscode-settings] 🔥 (look for _Abracadabra_)

### Rename Symbol

| Keybinding |
| :--------- |
| `F2`       |

> A `Symbol` is typically a variable or a function name.

This refactoring allows you to rename things and make sure all references in your code follow! It's easier and safer to use than a classic "Find and Replace".

[VS Code does this refactoring][vscode-rename-symbol] very well. That's why this refactoring is merely an alias. It delegates the work to VS Code.

Note that **it handles `.vue` files with a similar UX** while VS Code doesn't handle it natively yet.

[⬆️ Go to Table of Contents](#table-of-contents)

### Extract Variable

| Keybinding       | On Mac  |
| :--------------- | :------ |
| `Ctrl + Alt + V` | `⌥ ⌘ V` |

This refactoring helps you give a meaning to the hardcoded constants and low-level expressions. It makes your source code easier to read and maintain.

<details><summary>See it in action</summary>

![][demo-extract-variable]

It will extract the closest element from your cursor or partial selection.

![][demo-extract-variable-partial]

It will also handle multiple occurrences.

![][demo-extract-variable-multiple-occurrences]

</details><br />

[⬆️ Go to Table of Contents](#table-of-contents)

### Extract Generic Type

| Keybinding       | On Mac  |
| :--------------- | :------ |
| `Ctrl + Alt + V` | `⌥ ⌘ V` |

Just like for variables, this TS-specific refactoring will extract a type to make it generic.

<details><summary>See it in action</summary>

![][demo-extract-generic-type]

</details><br />

[⬆️ Go to Table of Contents](#table-of-contents)

### Inline Variable

| Keybinding       | On Mac  |
| :--------------- | :------ |
| `Ctrl + Alt + N` | `⌥ ⌘ N` |

This refactoring is the opposite of _Extract Variable_. It replaces a redundant usage of a variable or a constant with its initializer. It's usually helpful to inline things so you can extract them differently.

<details><summary>See it in action</summary>

![][demo-inline-variable]

</details><br />

[⬆️ Go to Table of Contents](#table-of-contents)

### Inline Function

| Keybinding       | On Mac  |
| :--------------- | :------ |
| `Ctrl + Alt + N` | `⌥ ⌘ N` |

This refactoring is similar to _Inline Variable_, but for functions. It replaces each call to the function with the function body. It helps to remove needless indirections.

<details><summary>See it in action</summary>

![][demo-inline-function]

</details><br />

[⬆️ Go to Table of Contents](#table-of-contents)

### Move Statement Up

| Keybinding        |
| :---------------- |
| `Alt + Shift + U` |

> A `Statement` is typically a variable or a function declaration.

Moves the whole selected statement up. If the selected statement and the one above are one-liners, this is the same as doing VS Code _Move Line Up_. But if one of these statements is multi-lines, this refactoring is very handy!

As for all refactorings, it works even if you partially select the statement, or if the cursor is on the statement.

<details><summary>See it in action</summary>

![][demo-move-statement-up]

</details><br />

[⬆️ Go to Table of Contents](#table-of-contents)

### Move Statement Down

| Keybinding        |
| :---------------- |
| `Alt + Shift + D` |

Same as _Move Statement Up_, but it moves the selected statement down. Like, the other direction. That's it.

<details><summary>See it in action</summary>

![][demo-move-statement-down]

_Move Statement Up_ and _Move Statement Down_ also work on object properties. They always produce valid code, so **you don't have to bother with the trailing comma anymore**!

![][demo-move-statement-object-property]

</details><br />

[⬆️ Go to Table of Contents](#table-of-contents)

### Negate Expression

> 💡 Available as Quick Fix (`Alt ↵`)

Negates the logical expression while preserving behaviour. It can be useful to tweak a logical expression before extracting meaningful chunks out of it.

<details><summary>See it in action</summary>

![][demo-negate-expression]

It will negate the closest expression from your cursor or partial selection.

![][demo-negate-expression-partial]

</details><br />

[⬆️ Go to Table of Contents](#table-of-contents)

### Remove Redundant Else

> 💡 Available as Quick Fix (`Alt ↵`)

Removes the `else` keyword when it's not necessary, resulting in less nested code. This refactoring helps you [replace nested conditional with guard clauses][replace-nested-conditional-with-guard-clauses] to make your code easier to read.

<details><summary>See it in action</summary>

![][demo-remove-redundant-else]

</details><br />

[⬆️ Go to Table of Contents](#table-of-contents)

### Simplify Ternary

> 💡 Available as Quick Fix (`Alt ↵`)

Simplify ternary expressions that you might end up with after executing other refactorings.

<details><summary>See it in action</summary>

![][demo-simplify-ternary]

</details><br />

### Flip If/Else

> 💡 Available as Quick Fix (`Alt ↵`)

Flips the `if` and `else` statements. It's a useful refactoring to have in your toolbelt to simplify logical expressions.

<details><summary>See it in action</summary>

![][demo-flip-if-else]

</details><br />

[⬆️ Go to Table of Contents](#table-of-contents)

### Flip Ternary

> 💡 Available as Quick Fix (`Alt ↵`)

Flips a ternary statement. It's really similar to _Flip If/Else_ refactoring.

<details><summary>See it in action</summary>

![][demo-flip-ternary]

</details><br />

[⬆️ Go to Table of Contents](#table-of-contents)

### Convert If/Else to Ternary

> 💡 Available as Quick Fix (`Alt ↵`)

Converts an if/else statement into a (shorter) ternary expression. This is very handy to improve code readability.

<details><summary>See it in action</summary>

![][demo-convert-if-else-to-ternary]

</details><br />

[⬆️ Go to Table of Contents](#table-of-contents)

### Convert Ternary to If/Else

> 💡 Available as Quick Fix (`Alt ↵`)

Converts a ternary expression into an if/else statement. It reverses _Convert If/Else to Ternary_ refactoring.

<details><summary>See it in action</summary>

![][demo-convert-ternary-to-if-else]

</details><br />

[⬆️ Go to Table of Contents](#table-of-contents)

### Convert If/Else to Switch

> 💡 Available as Quick Fix (`Alt ↵`)

Converts an if/else statement into a switch statement. This is typically what you do before introducing polymorphism to clean object-oriented code.

<details><summary>See it in action</summary>

![][demo-convert-if-else-to-switch]

</details><br />

[⬆️ Go to Table of Contents](#table-of-contents)

### Convert Switch to If/Else

> 💡 Available as Quick Fix (`Alt ↵`)

Converts a switch statement into an if/else statement. It reverses _Convert If/Else to Switch_ refactoring.

<details><summary>See it in action</summary>

![][demo-convert-switch-to-if-else]

</details><br />

[⬆️ Go to Table of Contents](#table-of-contents)

### Split If Statement

> 💡 Available as Quick Fix (`Alt ↵`)

Splits the logical expression of the closest if statement. This is an helpful tool to help you refactor complex branching logic, safely.

<details><summary>See it in action</summary>

![][demo-split-if-statement]

</details><br />

[⬆️ Go to Table of Contents](#table-of-contents)

### Merge If Statements

> 💡 Available as Quick Fix (`Alt ↵`)

This is the opposite of _Split If Statement_. It consolidates **nested** ifs to clean up the code.

<details><summary>See it in action</summary>

![][demo-merge-if-statements]

It also works with `else-if`.

![][demo-merge-if-statements-else-if]

</details><br />

[⬆️ Go to Table of Contents](#table-of-contents)

### Merge With Previous If Statement

> 💡 Available as Quick Fix (`Alt ↵`)

Merges selected statement with the if statement that is above. This is handy when you want to [decompose a conditional][decompose-conditional] to clean the code.

<details><summary>See it in action</summary>

![][demo-merge-with-previous-if-statement]

If you want to merge 2 consecutive if statements, it will resolve the dead code for you:

![][demo-merge-if-with-previous-if-statement]

</details><br />

[⬆️ Go to Table of Contents](#table-of-contents)

### Lift Up Conditional

> 💡 Available as Quick Fix (`Alt ↵`)

Useful when you need to have the similar conditionals at the top level. If you get there, you'll be able to convert them into a top-level `switch` statement, which you can easily refactor with polymorphism.

Hocus, pocus… This refactoring takes care of the gymnastic for you! Resulting code will have the same behaviour.

<details><summary>See it in action</summary>

![][demo-lift-up-conditional]

</details><br />

[⬆️ Go to Table of Contents](#table-of-contents)

### Extract Class

> 💡 Available as Quick Fix (`Alt ↵`)

Often, classes grow too big and do too many things. You want to split them by extracting some behavior in a new class.

This is where Abracadabra comes in and automate most of the grunt work for you. It can extract the properties and function you want in a keystrokes! It will take care of creating the new class while preserving existing behavior—it's a refactoring after all.

<details><summary>See it in action</summary>

![][demo-extract-class]

</details><br />

[⬆️ Go to Table of Contents](#table-of-contents)

### Remove Dead Code

> 💡 Available as Quick Fix (`Alt ↵`)

Sometimes, Abracadabra can determine that some code can't be reached. If so, it can also get rid of the dead code for you.

<details><summary>See it in action</summary>

![][demo-remove-dead-code]

</details><br />

[⬆️ Go to Table of Contents](#table-of-contents)

### Split Declaration and Initialization

> 💡 Available as Quick Fix (`Alt ↵`)

Splits the declaration of the variable and its initialization. If it's a `const`, it will convert it to `let`.

<details><summary>See it in action</summary>

![][demo-split-declaration-and-initialization]

</details><br />

[⬆️ Go to Table of Contents](#table-of-contents)

### Convert let to const

> 💡 Available as Quick Fix (`Alt ↵`)

Converts the declaration of a variable that is a `let` to a `const` if it's not mutated within the scope.

<details><summary>See it in action</summary>

![][demo-convert-let-to-const]

</details><br />

[⬆️ Go to Table of Contents](#table-of-contents)

### Convert to Arrow Function

> 💡 Available as Quick Fix (`Alt ↵`)

Converts a function declaration into an arrow function, which is convenient when you want to switch the syntax.

<details><summary>See it in action</summary>

![][demo-convert-to-arrow-function]

</details><br />

[⬆️ Go to Table of Contents](#table-of-contents)

### Add Braces to Arrow Function

> 💡 Available as Quick Fix (`Alt ↵`)

Useful when you need to add code in the body of an arrow function.

VS Code provides this refactoring, but it only works if you have the correct selection. This one works wherever your cursor is!

<details><summary>See it in action</summary>

![][demo-add-braces-to-arrow-function]

</details><br />

[⬆️ Go to Table of Contents](#table-of-contents)

### Remove Braces from Arrow Function

> 💡 Available as Quick Fix (`Alt ↵`)

Does the contrary of _Add Braces to Arrow Function_. Same advantages over VS Code: it works wherever your cursor is.

<details><summary>See it in action</summary>

![][demo-remove-braces-from-arrow-function]

</details><br />

[⬆️ Go to Table of Contents](#table-of-contents)

### Add Braces to If Statement

> 💡 Available as Quick Fix (`Alt ↵`)

Useful when you need to add code in the body of an `if` or `else` statement.

<details><summary>See it in action</summary>

![][demo-add-braces-to-if-statement]

</details><br />

[⬆️ Go to Table of Contents](#table-of-contents)

### Remove Braces from If Statement

> 💡 Available as Quick Fix (`Alt ↵`)

Does the contrary of _Add Braces to If Statement_: Removes braces from single-statement blocks in an `if` or `else` statement.

<details><summary>See it in action</summary>

![][demo-remove-braces-from-if-statement]

</details><br />

[⬆️ Go to Table of Contents](#table-of-contents)

### Convert to Template Literal

> 💡 Available as Quick Fix (`Alt ↵`)

This refactoring is already handled by VS Code.

But there's one scenario they don't want to handle: [convert simple strings into template literals](https://github.com/microsoft/TypeScript/issues/36784).

This is too bad because it's convenient to turn an existing string into a template literal to start adding some variables inside.

Hence, Abracadabra is proposing the refactoring for such scenario!

<details><summary>See it in action</summary>

![][demo-convert-to-template-literal]

</details><br />

[⬆️ Go to Table of Contents](#table-of-contents)

### Replace Binary with Assignment

> 💡 Available as Quick Fix (`Alt ↵`)

This one might seem obscure, but it's really replacing `+` with `+=`. Whenever it's possible, Abracadabra will propose you to refactor the code for a shorter (assignment) syntax.

<details><summary>See it in action</summary>

![][demo-replace-binary-with-assignment]

</details><br />

[⬆️ Go to Table of Contents](#table-of-contents)

### Convert For-Loop to Foreach

> 💡 Available as Quick Fix (`Alt ↵`)

When it's possible, it converts an old-school for-loop into a `forEach()` call.

<details><summary>See it in action</summary>

![][demo-convert-for-to-foreach]

</details><br />

[⬆️ Go to Table of Contents](#table-of-contents)

### Extract Interface

> 💡 Available as Quick Fix (`Alt ↵`)

Extract the interface from a class.

This is very useful when you need to invert a dependency: create an interface from an existing class, so you can provide a different implementation of this interface.

<details><summary>See it in action</summary>

![][demo-extract-interface]

</details><br />

[⬆️ Go to Table of Contents](#table-of-contents)

### Convert to Pure Component

> **Not** available as a Quick Fix, use the [Command Palette][command-palette] to run this one

This one is specific to React and comes from [react codemod][react-codemod].

It converts ES6 classes that only have a `render()` method, only have safe properties (statics and props), and do not have refs to Functional Components.

<details><summary>See it in action</summary>

![][demo-convert-to-pure-component]

</details><br />

[⬆️ Go to Table of Contents](#table-of-contents)

### Add braces to JSX attribute

> 💡 Available as Quick Fix (`Alt ↵`)

This refactoring is specific to React.

It adds curly braces to a JSX string literal, converting it into a JSX expression.

<details><summary>See it in action</summary>

![][demo-add-braces-to-jsx-attribute]

</details><br />

[⬆️ Go to Table of Contents](#table-of-contents)

### Remove braces from JSX attribute

> 💡 Available as Quick Fix (`Alt ↵`)

This refactoring is specific to React.

If a JSX attribute is a JSX expression containing only a string literal, it refactors the JSX expression into a string literal by removing the curly braces.

<details><summary>See it in action</summary>

![][demo-remove-braces-from-jsx-attribute]

</details><br />

[⬆️ Go to Table of Contents](#table-of-contents)

## Configuration

| Setting                      | Description                                | Default                             |
| ---------------------------- | ------------------------------------------ | ----------------------------------- |
| `abracadabra.ignoredFolders` | Folders where it won't propose Quick Fixes | `["node_modules", "dist", "build"]` |

All refactorings that appear in Quick Fix suggestions can also be disabled in [your VS Code settings][vscode-settings] 🔥 (look for _Abracadabra_)

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

[⬆️ Go to Table of Contents](#table-of-contents)

## Contributing

### [Contributing Guide][contributing]

Read our [contributing guide][contributing] to learn about our development process, how to propose bugfixes and improvements, and how to build and test your changes to Abracadabra.

### [Good First Issues][good-first-issues]

To help you get your feet wet and become familiar with our contribution process, we have a list of [good first issues][good-first-issues] that contains things with a relatively limited scope. This is a great place to get started!

[⬆️ Go to Table of Contents](#table-of-contents)

## Contributors

Thanks goes to these wonderful people ([emoji key][all-contributors-emoji]):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://nicoespeon.com/"><img src="https://avatars0.githubusercontent.com/u/1094774?v=4" width="100px;" alt=""/><br /><sub><b>Nicolas Carlo</b></sub></a><br /><a href="#ideas-nicoespeon" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=nicoespeon" title="Code">💻</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=nicoespeon" title="Documentation">📖</a> <a href="https://github.com/nicoespeon/abracadabra/pulls?q=is%3Apr+reviewed-by%3Anicoespeon" title="Reviewed Pull Requests">👀</a> <a href="#question-nicoespeon" title="Answering Questions">💬</a></td>
    <td align="center"><a href="https://fabien0102.com/"><img src="https://avatars1.githubusercontent.com/u/1761469?v=4" width="100px;" alt=""/><br /><sub><b>Fabien BERNARD</b></sub></a><br /><a href="#ideas-fabien0102" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=fabien0102" title="Code">💻</a> <a href="#design-fabien0102" title="Design">🎨</a></td>
    <td align="center"><a href="https://www.elsewebdevelopment.com/"><img src="https://avatars2.githubusercontent.com/u/12832280?v=4" width="100px;" alt=""/><br /><sub><b>David</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3ADavid-Else" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/HEYGUL"><img src="https://avatars2.githubusercontent.com/u/2989532?v=4" width="100px;" alt=""/><br /><sub><b>GUL</b></sub></a><br /><a href="#ideas-HEYGUL" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=HEYGUL" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/visusnet"><img src="https://avatars1.githubusercontent.com/u/1219124?v=4" width="100px;" alt=""/><br /><sub><b>Alexander Rose</b></sub></a><br /><a href="#ideas-visusnet" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=visusnet" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/timvancleef"><img src="https://avatars1.githubusercontent.com/u/7040078?v=4" width="100px;" alt=""/><br /><sub><b>Tim van Cleef</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/commits?author=timvancleef" title="Code">💻</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=timvancleef" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/automatensalat"><img src="https://avatars1.githubusercontent.com/u/26285169?v=4" width="100px;" alt=""/><br /><sub><b>Tobias Hann</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Aautomatensalat" title="Bug reports">🐛</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=automatensalat" title="Code">💻</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=automatensalat" title="Documentation">📖</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://twitter.com/capajj"><img src="https://avatars0.githubusercontent.com/u/1305378?v=4" width="100px;" alt=""/><br /><sub><b>Jiri Spac</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Acapaj" title="Bug reports">🐛</a></td>
    <td align="center"><a href="http://www.lyreal666.com/"><img src="https://avatars2.githubusercontent.com/u/41773861?v=4" width="100px;" alt=""/><br /><sub><b>YuTengjing</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Atjx666" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/delaaxe"><img src="https://avatars1.githubusercontent.com/u/1091900?v=4" width="100px;" alt=""/><br /><sub><b>delaaxe</b></sub></a><br /><a href="#ideas-delaaxe" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=delaaxe" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/jrnail23"><img src="https://avatars1.githubusercontent.com/u/392612?v=4" width="100px;" alt=""/><br /><sub><b>James Nail</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Ajrnail23" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://nickebbitt.github.io/"><img src="https://avatars3.githubusercontent.com/u/5111725?v=4" width="100px;" alt=""/><br /><sub><b>Nick Ebbitt</b></sub></a><br /><a href="#ideas-nickebbitt" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=nickebbitt" title="Code">💻</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=nickebbitt" title="Documentation">📖</a></td>
    <td align="center"><a href="https://oliverjash.me/"><img src="https://avatars2.githubusercontent.com/u/921609?v=4" width="100px;" alt=""/><br /><sub><b>Oliver Joseph Ash</b></sub></a><br /><a href="#ideas-OliverJAsh" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3AOliverJAsh" title="Bug reports">🐛</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=OliverJAsh" title="Code">💻</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=OliverJAsh" title="Documentation">📖</a></td>
    <td align="center"><a href="http://www.linkedin.com/in/albertoxamin"><img src="https://avatars3.githubusercontent.com/u/6067659?v=4" width="100px;" alt=""/><br /><sub><b>Alberto Xamin</b></sub></a><br /><a href="#ideas-albertoxamin" title="Ideas, Planning, & Feedback">🤔</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/sluukkonen"><img src="https://avatars1.githubusercontent.com/u/39655?v=4" width="100px;" alt=""/><br /><sub><b>Sakumatti Luukkonen</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Asluukkonen" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/justerest"><img src="https://avatars3.githubusercontent.com/u/24754883?v=4" width="100px;" alt=""/><br /><sub><b>Sergey Klevakin</b></sub></a><br /><a href="#ideas-justerest" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=justerest" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/ajanian"><img src="https://avatars1.githubusercontent.com/u/99716?v=4" width="100px;" alt=""/><br /><sub><b>Andrew Janian</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Aajanian" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/leosdad"><img src="https://avatars1.githubusercontent.com/u/7026091?v=4" width="100px;" alt=""/><br /><sub><b>leosdad</b></sub></a><br /><a href="#ideas-leosdad" title="Ideas, Planning, & Feedback">🤔</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors][all-contributors] specification.

Contributions of any kind are welcome!

[⬆️ Go to Table of Contents](#table-of-contents)

## Alternatives

<details>
<summary>VS Code native refactorings</summary><br />

VS Code ships with [basic refactoring operations][vscode-refactorings].

**Pros of Abracadabra** over these:

- VS Code refactorings require you to select the code exactly. You can trigger Abracadabra as long as your cursor is in the scope, which is simpler and faster.
- Abracadabra proposes more refactorings than the VS Code default ones.
- Abracadabra refactorings are documented.
- You can assign a shortcut to every Abracadabra refactoring.

**Cons of Abracadabra** over these:

- Abracadabra refactorings won't be as native as VS Code ones.
- Abracadabra refactorings are limited to JS, TS, JSX and TSX.

</details><br />

<details>
<summary>JS Refactor</summary><br />

The most popular extension for JavaScript refactoring is called [JS Refactor][js-refactor]. It provides JS automated refactorings for VS Code.

Abracadabra is quite similar. The differences are:

- Abracadabra refactorings are more opinionated. It makes the extension smoother and faster to use (less questions asked), but might not cover some use cases.
- Abracadabra only focus on refactorings. JS Refactor proposes code snippets and other code transformations.
- JS Refactor has less pure "refactorings" operations.
- Abracadabra uses VS Code Quick Fixes a lot to provide insights to the end user.
- JS Refactor is the most popular extension for JavaScript refactoring in VS Code.

</details><br />

<details>
<summary>JavaScript Booster</summary><br />

Another JavaScript refactoring extension for VS Code is [JavaScript Booster][js-booster]. It boosts your productivity with advanced JavaScript refactorings and commands.

Abracadabra is very similar to this one. They both rely on VS Code Quick Fixes. The few differences are:

- the proposed set of refactorings
- JavaScript Booster has a custom "Extend/Shrink selections" feature

</details>

### Why building yet another refactoring extension then?

Good question. The best move would surely have been to reach out one of the author of existing extensions to see how we could have improved them, instead of creating a new one.

But the motivations to build **Abracadabra** instead were:

- starting from scratch to poke around and move fast, without risking to break things
- scratch our own itch without having to make a case for it
- the curiosity of solving this problem with our vision (code architecture, what a great UX would be, etc.)

For now, we have fun and do our best to build a great extension!

When we'll have more experience, we'll probably ping the authors of other extensions to see how we could consolidate our efforts for the community. That's why we encourage you to test **Abracadabra** and [give us your feedback][create-new-issue]!

---

![](https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/magic.gif?raw=true)

## License

💁 [MIT][license]

<!-- Links -->

[hocus-pocus]: https://marketplace.visualstudio.com/items?itemName=nicoespeon.hocus-pocus
[command-palette]: https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette
[change-keybindings]: https://code.visualstudio.com/docs/getstarted/keybindings
[vscode-refactorings]: https://code.visualstudio.com/docs/editor/refactoring
[vscode-quick-fixes]: https://code.visualstudio.com/docs/editor/refactoring#_code-actions-quick-fixes-and-refactorings
[vscode-rename-symbol]: https://code.visualstudio.com/docs/editor/refactoring#_rename-symbol
[vscode-settings]: https://code.visualstudio.com/docs/getstarted/settings
[js-refactor]: https://marketplace.visualstudio.com/items?itemName=cmstead.jsrefactor
[js-booster]: https://marketplace.visualstudio.com/items?itemName=sburg.vscode-javascript-booster
[changelog]: https://github.com/nicoespeon/abracadabra/blob/master/CHANGELOG.md
[contributing]: https://github.com/nicoespeon/abracadabra/blob/master/CONTRIBUTING.md
[license]: https://github.com/nicoespeon/abracadabra/blob/master/LICENSE.md
[good-first-issues]: https://github.com/nicoespeon/abracadabra/issues?q=is%3Aissue+is%3Aopen+label%3A%22%3Awave%3A+Good+first+issue%22
[replace-nested-conditional-with-guard-clauses]: https://refactoring.guru/replace-nested-conditional-with-guard-clauses
[decompose-conditional]: https://refactoring.guru/decompose-conditional
[semver]: http://semver.org/
[all-contributors]: https://allcontributors.org
[all-contributors-emoji]: https://allcontributors.org/docs/en/emoji-key
[create-new-issue]: https://github.com/nicoespeon/abracadabra/issues/new/choose
[react-codemod]: https://github.com/reactjs/react-codemod

<!-- Demo images -->

[demo-command-palette]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/command-palette.png?raw=true
[demo-extract-variable]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/extract-variable.gif?raw=true
[demo-extract-variable-partial]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/extract-variable-partial.gif?raw=true
[demo-extract-variable-multiple-occurrences]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/extract-variable-multiple-occurrences.gif?raw=true
[demo-extract-generic-type]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/extract-generic-type.gif?raw=true
[demo-inline-variable]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/inline-variable.gif?raw=true
[demo-inline-function]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/inline-function.gif?raw=true
[demo-negate-expression]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/negate-expression.gif?raw=true
[demo-negate-expression-partial]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/negate-expression-partial.gif?raw=true
[demo-remove-redundant-else]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/remove-redundant-else.gif?raw=true
[demo-flip-if-else]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/flip-if-else.gif?raw=true
[demo-flip-ternary]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/flip-ternary.gif?raw=true
[demo-convert-to-arrow-function]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/convert-to-arrow-function.gif?raw=true
[demo-convert-if-else-to-ternary]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/convert-if-else-to-ternary.gif?raw=true
[demo-convert-ternary-to-if-else]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/convert-ternary-to-if-else.gif?raw=true
[demo-convert-if-else-to-switch]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/convert-if-else-to-switch.gif?raw=true
[demo-convert-let-to-const]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/convert-let-to-const.gif?raw=true
[demo-convert-switch-to-if-else]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/convert-switch-to-if-else.gif?raw=true
[demo-move-statement-up]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/move-statement-up.gif?raw=true
[demo-move-statement-down]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/move-statement-down.gif?raw=true
[demo-add-braces-to-arrow-function]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/add-braces-to-arrow-function.gif?raw=true
[demo-remove-braces-from-arrow-function]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/remove-braces-from-arrow-function.gif?raw=true
[demo-move-statement-object-property]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/move-statement-object-property.gif?raw=true
[demo-split-if-statement]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/split-if-statement.gif?raw=true
[demo-merge-if-statements]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/merge-if-statements.gif?raw=true
[demo-merge-if-statements-else-if]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/merge-if-statements-else-if.gif?raw=true
[demo-split-declaration-and-initialization]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/split-declaration-and-initialization.gif?raw=true
[demo-convert-to-template-literal]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/convert-to-template-literal.gif?raw=true
[demo-replace-binary-with-assignment]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/replace-binary-with-assignment.gif?raw=true
[demo-lift-up-conditional]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/lift-up-conditional.gif?raw=true
[demo-merge-with-previous-if-statement]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/merge-with-previous-if-statement.gif?raw=true
[demo-merge-if-with-previous-if-statement]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/merge-if-with-previous-if-statement.gif?raw=true
[demo-convert-for-to-foreach]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/convert-for-to-foreach.gif?raw=true
[demo-remove-dead-code]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/remove-dead-code.gif?raw=true
[demo-convert-to-pure-component]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/convert-to-pure-component.gif?raw=true
[demo-simplify-ternary]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/simplify-ternary.gif?raw=true
[demo-add-braces-to-if-statement]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/add-braces-to-if-statement.gif?raw=true
[demo-remove-braces-from-if-statement]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/remove-braces-from-if-statement.gif?raw=true
[demo-add-braces-to-jsx-attribute]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/add-braces-to-jsx-attribute.gif?raw=true
[demo-remove-braces-from-jsx-attribute]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/remove-braces-from-jsx-attribute.gif?raw=true
[demo-extract-interface]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/extract-interface.gif?raw=true
[demo-extract-class]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/extract-class.gif?raw=true

<!-- Logo -->

[logo-abracadabra]: https://github.com/nicoespeon/abracadabra/blob/master/docs/logo/abracadabra-logo.png?raw=true
