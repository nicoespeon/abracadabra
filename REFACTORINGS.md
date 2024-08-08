# List of available refactorings

![][logo-abracadabra]

All refactorings are available through the [Command Palette][command-palette].

![][demo-command-palette]

Some refactorings have default keybindings configured, but [you can change that][change-keybindings].

All other refactorings are available through [VS Code Quick Fixes][vscode-quick-fixes]. You can access them by clicking on the lightbulb that appear next to the code 💡 or use the default shortcut `Alt ↵`.

Pro Tip: You can also disable the Quick Fixes you never use in [VS Code settings][vscode-settings] 🔥 (look for _Abracadabra_)

## Table of Contents

- The Essentials:
  1. [Rename Symbol](#rename-symbol)
  1. [Extract Variable](#extract-variable)
  1. [Extract Type](#extract-type)
  1. [Inline Variable](#inline-variable)
  1. [Inline Function](#inline-function)
  1. [Change Signature](#change-signature)
  1. [Move Statement Up](#move-statement-up)
  1. [Move Statement Down](#move-statement-down)
- Simplifying Conditional Logic:
  1. [Invert Boolean Logic](#invert-boolean-logic)
  1. [Remove Redundant Else](#remove-redundant-else)
  1. [Simplify Boolean](#simplify-boolean)
  1. [Simplify Ternary](#simplify-ternary)
  1. [Flip If/Else](#flip-ifelse)
  1. [Flip Ternary](#flip-ternary)
  1. [Flip Operator](#flip-operator)
  1. [Convert If/Else to Ternary](#convert-ifelse-to-ternary)
  1. [Convert Ternary to If/Else](#convert-ternary-to-ifelse)
  1. [Convert If/Else to Switch](#convert-ifelse-to-switch)
  1. [Convert Switch to If/Else](#convert-switch-to-ifelse)
  1. [Split If Statement](#split-if-statement)
  1. [Merge If Statements](#merge-if-statements)
  1. [Merge With Previous If Statement](#merge-with-previous-if-statement)
  1. [Lift Up Conditional](#lift-up-conditional)
- Moving Features:
  1. [Remove Dead Code](#remove-dead-code)
- Organizing data:
  1. [Split Declaration and Initialization](#split-declaration-and-initialization)
  1. [Split Multiple Declarations](#split-multiple-declarations)
  1. [Convert let to const](#convert-let-to-const)
- Working around the syntax:
  1. [Add Numeric Separator](#add-numeric-separator)
  1. [Convert to Arrow Function](#convert-to-arrow-function)
  1. [Toggle Braces](#toggle-braces)
  1. [Convert to Template Literal](#convert-to-template-literal)
  1. [Replace Binary with Assignment](#replace-binary-with-assignment)
  1. [Convert For-Loop to ForEach](#convert-for-loop-to-foreach)
  1. [Convert ForEach to For-Of](#convert-foreach-to-for-of)
  1. [Create Factory for Constructor](#create-factory-for-constructor)
- Specific to TypeScript:
  1. [Extract Generic Type](#extract-generic-type)
  1. [Extract Interface](#extract-interface)
- Specific to JSX:
  1. [Wrap in JSX Fragment](#wrap-in-jsx-fragment)
  1. [Remove JSX Fragment](#remove-jsx-fragment)

## The Essentials

### Rename Symbol

| Keybinding |
| :--------- |
| `F2`       |

> A `Symbol` is typically a variable or a function name.

This refactoring allows you to rename things and make sure all references in your code follow! It's easier and safer to use than a classic "Find and Replace".

[VS Code does this refactoring][vscode-rename-symbol] very well. That's why this refactoring is merely an alias. It delegates the work to VS Code.

Note that **it handles `.vue` and `.svelte` files with a similar UX** while VS Code doesn't handle it natively yet.

For Vue and Svelte files, the support is limited: it can only rename **within the `<script>` tag**. It won't rename your identifier in the `<template>` tag for instance.

[⬆️ Go to Table of Contents](#table-of-contents)

### Extract Variable

| Keybinding       | On Mac  |
| :--------------- | :------ |
| `Ctrl + Alt + V` | `⌥ ⌘ V` |

This refactoring helps you give a meaning to the hardcoded constants and low-level expressions. It makes your source code easier to read and maintain.

![][demo-extract-variable]

It will extract the closest element from your cursor or partial selection.

![][demo-extract-variable-partial]

It will also handle multiple occurrences.

![][demo-extract-variable-multiple-occurrences]

[⬆️ Go to Table of Contents](#table-of-contents)

### Extract Type

| Keybinding       | On Mac  |
| :--------------- | :------ |
| `Ctrl + Alt + V` | `⌥ ⌘ V` |

This does exactly the same as Extract Variable, but for types!

![][demo-extract-type]

[⬆️ Go to Table of Contents](#table-of-contents)

### Inline Variable

> 💡 Available as Quick Fix (`Alt ↵`)

| Keybinding       | On Mac  |
| :--------------- | :------ |
| `Ctrl + Alt + N` | `⌥ ⌘ N` |

This refactoring is the opposite of _Extract Variable_. It replaces a redundant usage of a variable or a constant with its initializer. It's usually helpful to inline things so you can extract them differently.

![][demo-inline-variable]

[⬆️ Go to Table of Contents](#table-of-contents)

### Inline Function

| Keybinding       | On Mac  |
| :--------------- | :------ |
| `Ctrl + Alt + N` | `⌥ ⌘ N` |

This refactoring is similar to _Inline Variable_, but for functions. It replaces each call to the function with the function body. It helps to remove needless indirections.

![][demo-inline-function]

[⬆️ Go to Table of Contents](#table-of-contents)

### Change Signature

> 💡 Available as Quick Fix (`Alt ↵`)

This refactoring allows you to add, remove, or change the order of a function parameters. It will resolve and update the references to that function.

It supports function declarations, arrow functions, and class methods.

![][demo-change-signature]

[⬆️ Go to Table of Contents](#table-of-contents)

### Move Statement Up

| Keybinding        |
| :---------------- |
| `Alt + Shift + U` |

> A `Statement` is typically a variable or a function declaration.

Moves the whole selected statement up. If the selected statement and the one above are one-liners, this is the same as doing VS Code _Move Line Up_. But if one of these statements is multi-lines, this refactoring is very handy!

As for all refactorings, it works even if you partially select the statement, or if the cursor is on the statement.

![][demo-move-statement-up]

[⬆️ Go to Table of Contents](#table-of-contents)

### Move Statement Down

| Keybinding        |
| :---------------- |
| `Alt + Shift + D` |

Same as _Move Statement Up_, but it moves the selected statement down. Like, the other direction. That's it.

![][demo-move-statement-down]

_Move Statement Up_ and _Move Statement Down_ also work on object properties. They always produce valid code, so **you don't have to bother with the trailing comma anymore**!

![][demo-move-statement-object-property]

[⬆️ Go to Table of Contents](#table-of-contents)

## Simplifying Conditional Logic

### Invert Boolean Logic

> 💡 Available as Quick Fix (`Alt ↵`)

Inverts the logical expression while preserving behaviour. It can be useful to tweak a logical expression before extracting meaningful chunks out of it.

This refactoring follows [De Morgan's laws](https://en.wikipedia.org/wiki/De_Morgan%27s_laws).

![][demo-invert-boolean-logic]

It will invert the closest expression from your cursor or partial selection.

![][demo-invert-boolean-logic-partial]

[⬆️ Go to Table of Contents](#table-of-contents)

### Remove Redundant Else

> 💡 Available as Quick Fix (`Alt ↵`)

Removes the `else` keyword when it's not necessary, resulting in less nested code. This refactoring helps you [replace nested conditional with guard clauses][replace-nested-conditional-with-guard-clauses] to make your code easier to read.

![][demo-remove-redundant-else]

[⬆️ Go to Table of Contents](#table-of-contents)

### Simplify Boolean

> 💡 Available as Quick Fix (`Alt ↵`)

Simplify boolean expressions that you might end up with after executing other refactorings.

![][demo-simplify-boolean]

[⬆️ Go to Table of Contents](#table-of-contents)

### Simplify Ternary

> 💡 Available as Quick Fix (`Alt ↵`)

Simplify ternary expressions that you might end up with after executing other refactorings.

![][demo-simplify-ternary]

[⬆️ Go to Table of Contents](#table-of-contents)

### Flip If/Else

> 💡 Available as Quick Fix (`Alt ↵`)

Flips the `if` and `else` statements. It's a useful refactoring to have in your toolbelt to simplify logical expressions.

![][demo-flip-if-else]

[⬆️ Go to Table of Contents](#table-of-contents)

### Flip Ternary

> 💡 Available as Quick Fix (`Alt ↵`)

Flips a ternary statement. It's really similar to _Flip If/Else_ refactoring.

![][demo-flip-ternary]

[⬆️ Go to Table of Contents](#table-of-contents)

### Flip Operator

> 💡 Available as Quick Fix (`Alt ↵`)

Flips the left and right side of an operator. Very handy to introduce [Yoda Conditions](https://en.wikipedia.org/wiki/Yoda_conditions) in the code.

![][demo-flip-operator]

[⬆️ Go to Table of Contents](#table-of-contents)

### Convert If/Else to Ternary

> 💡 Available as Quick Fix (`Alt ↵`)

Converts an if/else statement into a (shorter) ternary expression. This is very handy to improve code readability.

![][demo-convert-if-else-to-ternary]

[⬆️ Go to Table of Contents](#table-of-contents)

### Convert Ternary to If/Else

> 💡 Available as Quick Fix (`Alt ↵`)

Converts a ternary expression into an if/else statement. It reverses _Convert If/Else to Ternary_ refactoring.

![][demo-convert-ternary-to-if-else]

[⬆️ Go to Table of Contents](#table-of-contents)

### Convert If/Else to Switch

> 💡 Available as Quick Fix (`Alt ↵`)

Converts an if/else statement into a switch statement. This is typically what you do before introducing polymorphism to clean object-oriented code.

![][demo-convert-if-else-to-switch]

[⬆️ Go to Table of Contents](#table-of-contents)

### Convert Switch to If/Else

> 💡 Available as Quick Fix (`Alt ↵`)

Converts a switch statement into an if/else statement. It reverses _Convert If/Else to Switch_ refactoring.

![][demo-convert-switch-to-if-else]

[⬆️ Go to Table of Contents](#table-of-contents)

### Split If Statement

> 💡 Available as Quick Fix (`Alt ↵`)

Splits the logical expression of the closest if statement. This is an helpful tool to help you refactor complex branching logic, safely.

![][demo-split-if-statement]

[⬆️ Go to Table of Contents](#table-of-contents)

### Merge If Statements

> 💡 Available as Quick Fix (`Alt ↵`)

This is the opposite of _Split If Statement_. It consolidates conditional expressions to clean up the code.

![][demo-merge-if-statements]

It also works with `else-if`.

![][demo-merge-if-statements-else-if]

It also handles consecutive if statements that can be merged.

![][demo-merge-if-statements-with-sibling]

[⬆️ Go to Table of Contents](#table-of-contents)

### Merge With Previous If Statement

> 💡 Available as Quick Fix (`Alt ↵`)

Merges selected statement with the if statement that is above. This is handy when you want to [decompose a conditional][decompose-conditional] to clean the code.

![][demo-merge-with-previous-if-statement]

If you want to merge 2 consecutive if statements, it will resolve the dead code for you:

![][demo-merge-if-with-previous-if-statement]

[⬆️ Go to Table of Contents](#table-of-contents)

### Lift Up Conditional

> 💡 Available as Quick Fix (`Alt ↵`)

Useful when you need to have the similar conditionals at the top level. If you get there, you'll be able to convert them into a top-level `switch` statement, which you can easily refactor with polymorphism.

Hocus, pocus… This refactoring takes care of the gymnastic for you! Resulting code will have the same behaviour.

![][demo-lift-up-conditional]

[⬆️ Go to Table of Contents](#table-of-contents)

## Moving Features

### Remove Dead Code

> 💡 Available as Quick Fix (`Alt ↵`)

Sometimes, Abracadabra can determine that some code can't be reached. If so, it can also get rid of the dead code for you.

![][demo-remove-dead-code]

[⬆️ Go to Table of Contents](#table-of-contents)

## Organizing data

### Split Declaration and Initialization

> 💡 Available as Quick Fix (`Alt ↵`)

Splits the declaration of the variable and its initialization. If it's a `const`, it will convert it to `let`.

![][demo-split-declaration-and-initialization]

[⬆️ Go to Table of Contents](#table-of-contents)

### Split Multiple Declarations

> 💡 Available as Quick Fix (`Alt ↵`)

Splits multiple variables declarated together onto a single line each.

![][demo-split-multiple-declarations]

[⬆️ Go to Table of Contents](#table-of-contents)

### Convert let to const

> 💡 Available as Quick Fix (`Alt ↵`)

Converts the declaration of a variable that is a `let` to a `const` if it's not mutated within the scope.

![][demo-convert-let-to-const]

[⬆️ Go to Table of Contents](#table-of-contents)

## Working around the syntax

### Add Numeric Separator

> 💡 Available as Quick Fix (`Alt ↵`)

Did you know you could write `10_000` instead of `10000`? Well, now you know. And you can make code easier to read with 2 keystrokes!

![][demo-add-numeric-separator]

[⬆️ Go to Table of Contents](#table-of-contents)

### Convert to Arrow Function

> 💡 Available as Quick Fix (`Alt ↵`)

Converts a function declaration into an arrow function, which is convenient when you want to switch the syntax.

![][demo-convert-to-arrow-function]

[⬆️ Go to Table of Contents](#table-of-contents)

### Toggle Braces

> 💡 Available as Quick Fix (`Alt ↵`)

Sometimes you need to add braces before you add more code. Other times you don't need them and prefer to get rid of them.

This refactoring allows you to toggle the braces on the closest statement of your cursor!

It works on:

- If Statements (both `if` and `else` independently)
- Arrow Function Expressions (e.g. `const someFunction = () => {}`)
- JSX Attributes (e.g. `<SomeComponent anAttribute={"a value"} />`)
- Loops (for and while blocks)

![][demo-toggle-braces]

[⬆️ Go to Table of Contents](#table-of-contents)

### Convert to Template Literal

> 💡 Available as Quick Fix (`Alt ↵`)

This refactoring is already handled by VS Code.

But there's one scenario they don't want to handle: [convert simple strings into template literals](https://github.com/microsoft/TypeScript/issues/36784).

This is too bad because it's convenient to turn an existing string into a template literal to start adding some variables inside.

Hence, Abracadabra is proposing the refactoring for such scenario!

![][demo-convert-to-template-literal]

By default, this refactoring will automatically apply if you write `${}` in a string literal. This is convenient behavior in most scenarios, but technically changes code behaviour.

If you want to disable the automatic transformation, you can turn OFF `abracadabra.autoConvertToTemplateLiteral` in [VS Code settings][vscode-settings].

[⬆️ Go to Table of Contents](#table-of-contents)

### Replace Binary with Assignment

> 💡 Available as Quick Fix (`Alt ↵`)

This one might seem obscure, but it's really replacing `+` with `+=`. Whenever it's possible, Abracadabra will propose you to refactor the code for a shorter (assignment) syntax.

![][demo-replace-binary-with-assignment]

[⬆️ Go to Table of Contents](#table-of-contents)

### Convert For-Loop to ForEach

> 💡 Available as Quick Fix (`Alt ↵`)

When it's possible, it converts an old-school for-loop into a `for-Each()` call.

![][demo-convert-for-to-for-each]

[⬆️ Go to Table of Contents](#table-of-contents)

### Convert ForEach to For-Of

> 💡 Available as Quick Fix (`Alt ↵`)

When it's possible, it converts a `forEach()` into a `for-of` loop.

![][demo-convert-for-each-to-for-of]

[⬆️ Go to Table of Contents](#table-of-contents)

### Create Factory for Constructor

> 💡 Available as Quick Fix (`Alt ↵`)

Create a factory function to instantiate the selected class. This can be useful when you want to expose a regular function while using a class behind the hood.

Regular functions don't need `new` to be invoked, which makes them easier to compose around.

![][demo-create-factory-for-constructor]

[⬆️ Go to Table of Contents](#table-of-contents)

## Specific to TypeScript

### Extract Generic Type

> 💡 Available as Quick Fix (`Alt ↵`)

This refactoring will turn an existing type into a generic. Very handy when you need to make an interface more generic.

![][demo-extract-generic-type]

[⬆️ Go to Table of Contents](#table-of-contents)

### Extract Interface

> 💡 Available as Quick Fix (`Alt ↵`)

Extract the interface from a class.

This is very useful when you need to invert a dependency: create an interface from an existing class, so you can provide a different implementation of this interface.

![][demo-extract-interface]

[⬆️ Go to Table of Contents](#table-of-contents)

## Specific to JSX

### Wrap in JSX Fragment

> 💡 Available as Quick Fix (`Alt ↵`)

Handy when you need to add another JSX element next to the one you have, but keep a single root!

![][demo-wrap-in-jsx-fragment]

[⬆️ Go to Table of Contents](#table-of-contents)

### Remove JSX Fragment

> 💡 Available as Quick Fix (`Alt ↵`)

Reverse operation of "Wrap in JSX Fragment". Useful when something is unnecessarily nested inside a fragment.

It won't remove a fragment that's required though: only the ones that have a single child node.

![][demo-remove-jsx-fragment]

[⬆️ Go to Table of Contents](#table-of-contents)

<!-- Links -->

[command-palette]: https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette
[change-keybindings]: https://code.visualstudio.com/docs/getstarted/keybindings
[vscode-quick-fixes]: https://code.visualstudio.com/docs/editor/refactoring#_code-actions-quick-fixes-and-refactorings
[vscode-rename-symbol]: https://code.visualstudio.com/docs/editor/refactoring#_rename-symbol
[vscode-settings]: https://code.visualstudio.com/docs/getstarted/settings
[replace-nested-conditional-with-guard-clauses]: https://refactoring.guru/replace-nested-conditional-with-guard-clauses
[decompose-conditional]: https://refactoring.guru/decompose-conditional

<!-- Demo images -->

[demo-command-palette]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/command-palette.png?raw=true
[demo-extract-type]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/extract-type.gif?raw=true
[demo-extract-variable]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/extract-variable.gif?raw=true
[demo-extract-variable-partial]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/extract-variable-partial.gif?raw=true
[demo-extract-variable-multiple-occurrences]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/extract-variable-multiple-occurrences.gif?raw=true
[demo-extract-generic-type]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/extract-generic-type.gif?raw=true
[demo-inline-variable]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/inline-variable.gif?raw=true
[demo-inline-function]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/inline-function.gif?raw=true
[demo-change-signature]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/change-signature.gif?raw=true
[demo-invert-boolean-logic]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/invert-boolean-logic.gif?raw=true
[demo-invert-boolean-logic-partial]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/invert-boolean-logic-partial.gif?raw=true
[demo-remove-redundant-else]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/remove-redundant-else.gif?raw=true
[demo-flip-if-else]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/flip-if-else.gif?raw=true
[demo-flip-ternary]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/flip-ternary.gif?raw=true
[demo-flip-operator]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/flip-operator.gif?raw=true
[demo-add-numeric-separator]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/add-numeric-separator.gif?raw=true
[demo-convert-to-arrow-function]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/convert-to-arrow-function.gif?raw=true
[demo-convert-if-else-to-ternary]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/convert-if-else-to-ternary.gif?raw=true
[demo-convert-ternary-to-if-else]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/convert-ternary-to-if-else.gif?raw=true
[demo-convert-if-else-to-switch]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/convert-if-else-to-switch.gif?raw=true
[demo-convert-let-to-const]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/convert-let-to-const.gif?raw=true
[demo-convert-switch-to-if-else]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/convert-switch-to-if-else.gif?raw=true
[demo-move-statement-up]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/move-statement-up.gif?raw=true
[demo-move-statement-down]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/move-statement-down.gif?raw=true
[demo-move-statement-object-property]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/move-statement-object-property.gif?raw=true
[demo-split-if-statement]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/split-if-statement.gif?raw=true
[demo-merge-if-statements]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/merge-if-statements.gif?raw=true
[demo-merge-if-statements-else-if]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/merge-if-statements-else-if.gif?raw=true
[demo-merge-if-statements-with-sibling]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/merge-if-statements-with-sibling.gif?raw=true
[demo-split-declaration-and-initialization]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/split-declaration-and-initialization.gif?raw=true
[demo-split-multiple-declarations]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/split-multiple-declarations.gif?raw=true
[demo-convert-to-template-literal]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/convert-to-template-literal.gif?raw=true
[demo-replace-binary-with-assignment]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/replace-binary-with-assignment.gif?raw=true
[demo-lift-up-conditional]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/lift-up-conditional.gif?raw=true
[demo-merge-with-previous-if-statement]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/merge-with-previous-if-statement.gif?raw=true
[demo-merge-if-with-previous-if-statement]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/merge-if-with-previous-if-statement.gif?raw=true
[demo-convert-for-to-for-each]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/convert-for-to-for-each.gif?raw=true
[demo-convert-for-each-to-for-of]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/convert-for-each-to-for-of.gif?raw=true
[demo-create-factory-for-constructor]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/create-factory-for-constructor.gif?raw=true
[demo-remove-dead-code]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/remove-dead-code.gif?raw=true
[demo-simplify-boolean]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/simplify-boolean.gif?raw=true
[demo-simplify-ternary]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/simplify-ternary.gif?raw=true
[demo-extract-interface]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/extract-interface.gif?raw=true
[demo-toggle-braces]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/toggle-braces.gif?raw=true
[demo-wrap-in-jsx-fragment]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/wrap-in-jsx-fragment.gif?raw=true
[demo-remove-jsx-fragment]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/remove-jsx-fragment.gif?raw=true

<!-- Logo -->

[logo-abracadabra]: https://github.com/nicoespeon/abracadabra/blob/main/docs/logo/abracadabra-logo.png?raw=true
