# Changelog

All notable changes to the **Abracadabra** extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [9.1.2]

### Fixed

- @waltergalvao found an issue with "Convert to Arrow Function" when the function was default exported. This should be working fine now!

## [9.1.1]

No user-visible change. Attempting to fix CI deployment.

## [9.1.0] - 2024-01-08 - Knowing What I Know Now 👑

### Added

- New `abracadabra.getMaxFileSizeKb` option that will disable refactorings based on the size of a file. Default value is 250 (in kB). The idea is to complement `abracadabra.maxFileLinesCount` for files that would be minified.

### Fixed

- Trying to execute a refactoring in an untitled tab used to throw an error, but not anymore thanks to @j4k0xb!

## [9.0.2]

No user-visible change. Mostly dependencies upgrades.

### Breaking

## [9.0.1]

No user-visible change. Mostly dependencies upgrades.

## [9.0.0] - 2023-10-28 - On My Way 🐻

### Breaking

- Removed "Move to existing file" since VS Code now has a native "Move to file" that works like a charm ❤️
- Removed "Destructure Object" since VS Code has a native "Convert parameters to destructured object" since TS 3.4 that works much better. Also, "Destructure Object" was causing performance trouble and was making the bundle much bigger than necessary, because it was using the whole TS library.
- Removed "Extract useCallback" for a similar reason. Although the feature doesn't exist, this one-off refactoring had an unreasonable impact on the whole extension (bundle size and performances).

### Added

- New `abracadabra.maxFileLinesCount` option that will disable refactorings based on the number of lines of a file. Default value is 10,000. The goal is to reduce the impact on performance when you have a large file (eg. a bundle) in your codebase.

### Fixed

- @j4k0xb found even more occurrences of patterns that require parentheses when executing Inline Variable. These are now covered.

## [8.1.4]

### Fixed

- Inline Variable now adds parentheses around expressions that should have one. Thanks @xixixao for catching these. Eg.

```js
const x = a + b;
const result = x * 100;

// Used to wrongly result in
const result = a + b * 100;

// Will now result in
const result = (a + b) * 100;
```

## [8.1.3]

No user-visible change. Mostly dependencies upgrades.

## [8.1.2]

### Fixed

- Flip If/Else refactoring would mess up code if you were styling code without semicolons. Thanks to @victor-homyakov for reporting!

## [8.1.1]

### Fixed

- Fix a scenario where extracting a variable could mess up with the code. Eg.

```js
function updateQuality() {
  for (var i = 0; i < items.length; i++) {
    // Extracting `items[i]` used to produce invalid code, not anymore!
    if (items[i].name != "SULFURAS") {
      items[i].sellIn = items[i].sellIn - 1;
    }
  }

  return items;
}
```

- Fix "Lift Up Conditional" when the parent if has an alternate node. The original specs were incorrect and have been fixed.

```js
// Lifting up `if (isCorrect)` used to produce invalid code, not anymore!
if (isValid) {
  if (isCorrect) {
    doSomething();
  }
} else {
  doAnotherThing();
}
```

## [8.1.0] - 2023-05-19 - You’ll Be in My Heart 🌳

### Fixed

- "Change Signature" was not working on multi-line calls. Thanks to @pomeh, this has been fixed!

### Added

- **[New Refactoring]** "Remove JSX Fragment" thanks to @DerTimonius. This allows you to switch back and forth with "Wrap in JSX Fragment".

## [8.0.1]

No user-visible change. Mostly dependencies upgrades.

## [8.0.0] - 2023-04-13 - Let It Go 🏔️

### Breaking Changes

The following refactorings were removed from Abracadabra (until re-implemented):

- Extract Class
- Convert to Pure Component (React)

Why? There are causing trouble that aren't worth it ([see detailed ADR][adr-0013]).

## [7.1.1]

No user-visible change. Mostly dependencies upgrades.

## [7.1.0] - 2023-04-13 - Two Worlds, One JSX 🌴

### Fixed

- Change Signature wasn't working on nested functions. It has been reported by @SamB and fixed!
- Extract Variable may declare the new variable before another variable it references under some circumstances. These have been fixed. Kudos to @tjx666 for finding that!

### Added

- **[New Refactoring]** "Wrap in JSX Fragment" thanks to @DerTimonius. This will help you refactor JSX code to add more elements within a single root.

## [7.0.0] - 2023-02-15 - Bella Note 🍝

### Changed

- **(Breaking)** Change Windows key bindings for the Toggle Highlight feature. It was hijacking the default shortcut to replace code on this OS, which is not cool. Thanks @stevebeauge for reporting.

### Fixed

- Inline Variable was producing invalid code when inlining an async arrow function expression. Not anymore! Thanks @automatensalat for reporting, as always 😉

## [6.19.0] - 2023-02-03 - Let’s go Highlight an Identifier 🪁

### Added

- New feature to support refactorings: **Highlight Identifiers**. It can help you highlight all references to different variables.

![][demo-toggle-highlights]

### Changed

- Generated interfaces now have a consistent `;` at the end of each line. This is a side-effect of upgrading Recast to solve [#795](https://github.com/nicoespeon/abracadabra/issues/795)

### Fixed

- Fixed a bug where parser would not handle comments within an object that uses the `satisfies` operator. Kudos to @byronwall for [the detailed report](https://github.com/nicoespeon/abracadabra/issues/795)!
- Inlining JSX in a JSX attribute doesn't remove the curly braces anymore. Thanks @automatensalat for reporting.
- Extracting a variable when cursor is on a JSX attribute name used to break the code. Now it will resolve the closest extractable chunk (the JSX Element). Thanks again @automatensalat for reporting.

## [6.18.2]

No user-visible change. Attempting to fix CI deployments.

## [6.18.1]

### Fixed

- Upgrade the parser so it handles TS new `satisfies` operator syntax.

### Changed

- Activation of the extension is now delayed [after VS Code has fully started](https://code.visualstudio.com/api/references/activation-events#onStartupFinished). Thus, it won't slow down your editor startup since you probably don't need your refactorings right away—I bet you won't notice they load ~2s after your editor is up 😄

## [6.18.0] - 2022-12-28 - He Mele No Refactoring 🏄

### Added

- 'Change Signature' now supports adding and removing parameters, thanks to @11joselu 🎉

### Improved

- Do not show 'Change Signature' quick fix when a function/method does _not_ have parameters (thanks @11joselu)

### Fixed

- Some refactorings were not preserving important parentheses, which could have introduced regressions (eg. "Flip If/Else"). Now they do just fine!

## [6.17.0] - 2022-11-15 - What Else Can I Do? 🌼

### Added

- **[New Refactoring]** "Change Signature" thanks to @11joselu's great work to find function references across files.
- **[New Refactoring]** "Flip Operator" thanks to @ramunsk's idea of introducing "Yoda Conditions" and @j4k0xb implementation of it.

### Fixed

- "Toggle Braces" and "Convert to ForEach" used to transform the outside-most wrapper that would match the transformation. Now, they transform the selected target, even if it's deeply nested. Props to @j4k0xb for finding this one.

## [6.16.0] - 2022-10-20 - Kidnap the Svelty Claws 🎃

### Added

- **Support for `.svelte` files**. @srsholmes enabled Abracadabra refactorings support for `.svelte` files. How cool is that?!

### Changed

- Give more user-friendly default names for `new` expressions, thanks to @azhiv

### Fixed

- @chrstnbrn fixed an issue where comments might get deleted when performing some refactorings. Kudos!

## [6.15.3]

No user-visible change. Attempting to fix CI deployments.

## [6.15.2]

No user-visible change. Fixed deployments to VS Code web.

## [6.15.1]

No user-visible change. Mostly dependencies upgrades.

## [6.15.0] - 2022-08-01 - The Bare Necessities 🐻

### Added

- Make "Convert For to ForEach" support Member Expressions (eg. `for (const item of foo.bar)`).
- Make "Convert to Arrow Function" handle more situations where the refactoring can be performed.

### Fixed

- Remove type annotations when moving a variable declaration with "Move to Existing File", so the import pattern is not broken.
- Fix scenarios where "Convert to Arrow Function" wouldn't execute but should have. Thanks @abulka for the detailed report!
- "Inline Variable" now works fine when used on a destructured, computed CallExpression (like `const { test } = a[b()]`). Kudos to @zardoy!

## [6.14.4]

A few more upgraded packages!

## [6.14.3]

Upgraded a few dependencies and added a sponsor badge to the extension.

## [6.14.2]

No user-visible change. This release makes Abracadabra work in browser environments again.

## [6.14.1]

No user-visible change. This release fixes the deployment of 6.14 in all the target environments.

## [6.14.0] - 2022-06-13 - A Cover Is Not the Book 📕

### Added

- "Extract Interface" will let you know when it couldn't determine the return type of a method.
- "Move to existing file" can now move interfaces with generics. Kudos @jtwigg for raising that up!
- Make "Inline Function" work if an object key matches one of the parameter name in the function body. Props to @automatensalat for spotting this one!
- **[New Refactoring]** "Extract useCallback()" for React, kudos to @ianobermiller for this one!

## [6.13.0] - 2022-04-21 - Oo-De-Lally 🏹

### Fixed

- "Inline Function" now works on async function without creating a double `await`. Thanks @automatensalat for catching this!
- Fixed an issue with "Convert to Template Literal" and backticks. Thanks @fabien0102!
- Extract Interface doesn't remove existing interface implements anymore. Thanks @BuZZ-dEE!

### Changed

- Expose "Inline Variable" as a quick fix, as suggested by @brunnerh

### Added

- Make Convert Switch to If-Statement handle switches with only a `default` statement. Thanks @11joselu for the suggestion!

## [6.12.0] - 2022-03-11 - Some Things Never Change 🍁

### Added

- Move to existing file now supports moving exported elements. It will preserve the export, so your module API won't break.
- Move to existing file can now move variable declarations too!

## [6.11.0] - 2022-02-19 - Dos Oruguitas 🦋

### Fixed

- Inline Variable won't remove the extraneous `${}` if it can't, so you don't end up with broken code. Thanks @rsxdalv for reporting this one 👍

### Added

- Move Statements now support JSX attributes, so you can swap them with a single keystroke 🏇
- Remove Redundant Else will now work if the If statement has no sibling next. It will insert the necessary `return` statement to create a guard clause for you.

## [6.10.0] - 2022-01-17 - When You Wish Upon a Star ⭐

### Fixed

- "Convert For to ForEach" used to singularize the array name for naming each individual item. That's naive, not all array variables are plural! It will now fallback on `<arrayName>Item` if it can't find a singular name for the array.
- Likewise, "Convert For to ForEach" was breaking re-assignment by replacing `myArray[i] = xyz` with `myArrayItem = xyz`, which doesn't work. Not anymore! Thanks to @alanhussey for reporting these bugs 🙏
- "Extract Interface" now works on default exports too. Thanks @kevintechie for spotting this one.

### Added

- Make "Move Statements" work with JSX expressions too, so you can swap some `{variable}` in your JSX code!
- Move Statements Up/Down now work on object expressions that are nested inside arrays. For instance:

```js
const d = [
  {
    a: 5
  },
  {
    b: 5
  }
];
```

You can swap these multi-lines objects with a single shortcut (defaults are `Alt + Shift + U` for moving up, `Alt + Shift + D` for moving down):

```js
const d = [
  {
    b: 5
  },
  {
    a: 5
  }
];
```

## [6.9.1]

### Changed

- Thanks to @zardoy, installing the extension is much faster! In short, we don't bundle demo gifs in the extension anymore (🤦‍♂️), saving dozens of MBs.
- Shoutout to @tjx666 who upgraded how the project is linted. No impact on you, but a useful improvement for maintainers ❤️

## [6.9.0] - 2022-01-07 - He's a Tramp 🐶

### Fixed

- @j4k0xb fixed the action provider for the "Convert For to Foreach" refactoring. Great catch!

### Added

- Inline Variable inside a template literal will remove the extraneous `${}` so you don't end up with `${"some string"}` in the middle of your template string.
- Extract Variable now works in for..of statements.
- Abracadabra is now available on VS Code web! That means you can install (and use) the extension when working on https://vscode.dev or https://github.dev for instance.

## [6.8.0] - 2021-11-25 - Extract De Vil 🐶

### Fixed

- Extract Interface now preserves generic parameter declaration, thanks to @automatensalat who reported and fixed the bug!

### Changed

- Extract Variable can be executed from the `return` keyword. It will extract the returned value just as if the cursor was on the value already. It also makes it more flexible, so extraction will work even if you have the return statement semicolon in your selection. Thanks @automatensalat for suggesting this one!
- Extract Variable can also be executed on JSX Attributes that are string literals. A partial selection will convert the string into a template literal and extract the selected text only.
- Destructure Object now handles spread elements and spread JSX attributes automatically.

### Added

- **[New Refactoring]** Create Factory for Constructor, which creates a regular function to instantiate the selected class.

## [6.7.1]

No change but fixed the declared VS Code engine version so we can deploy again.

## [6.7.0] - 2021-11-04 − Extract Like Me 🧞‍♂️

### Fixed

- Extract on the left-side of an `as` expression will now extract the variable, not the type.
- Extract Interface now works on exported class declarations too! Thanks @automatensalat for raising it 🙏

### Changed

- Convert Ternary to If/Else now works on any ternary, not just the ones that have a `return` or variable assignment inside.
- Move Statements now work on JSX Elements too! There will probably be edge-cases to iron out over time, but it's good to know that you can swap 2 JSX statements with a single shortcut ⚡
- _Negate Expression_ name was misleading. It was renamed into _Invert Boolean Logic_ as per @forivall's [recommendation](https://github.com/nicoespeon/abracadabra/issues/422) 🙏
- Extract Variable now declares the variable before the leading comments of the parent node.

## [6.6.0] - 2021-10-14 − What's This? 🎃

### Fixed

- Fix a scenario where Extract Type would produce invalid code if there were commas in the extracted type.
- Fix some scenarios where Extract Variable would put the cursor in a wrong place which prevented the automatic rename.

### Added

- **[New Refactoring]** Convert ForEach to For-Of, thanks to @ianobermiller for this one 🎉

## [6.5.2] - 2021-10-05

### Fixed

- Destructure Object is not performant. That's an issue on large projects as it's exposed as a Quick Fix (lightbulb). To prevent blocking your editor, we have disabled the Quick Fix for this refactoring.

You can still execute this refactoring using [VS Code's Command Palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette).

We'll put it back as a quick fix once the performance issue is solved. See [#415](https://github.com/nicoespeon/abracadabra/issues/415) for details.

## [6.5.1] - 2021-10-04

A little fix to get the release deployed to the marketplaces.

## [6.5.0] - 2021-10-04 - A Dream Is a Wish Your Heart Makes 🐭

### Fixed

- Flip If/Else now uses `continue` instead of `return` in loops, so your code doesn't break. Thanks @j4k0xb for spotting this one!

### Changed

- Extract Type can now extract TS type queries. That means you can extract some `typeof myVariable` into a type alias.
- Extract Type can also extract union and intersection types from anywhere now!
- Toggle Braces now works on all kind of loops (for, for-in, for-of, while, do-while). Thanks to @chrstnbrn for implementing these 👏

### Added

- **[New Refactoring]** You can now destructure an object automatically! Put your cursor on any occurrence of the identifier to trigger the refactoring. It works if the shape of the object can be inferred, so that works best with TypeScript code (e.g. `interface` and object-like types).

![][demo-destructure-object]

## [6.4.0] - 2021-09-16 - Friends on the Other Side 🐸

### Fixed

- Finally got "Move to existing file" work on Windows OS, thanks to @sumbatx15
- Merge If Statements used to appear on patterns it couldn't execute on. Not anymore!

### Changed

- Extract Type now works on Type Parameters too (e.g. `number` in `doSomething<number>()` can now be extracted).

### Added

- **[New Refactoring]** Add separators to numeric literals. It's a not well known syntax that makes magic numbers easier to read. You can now turn `100000` into `10_000` in a snap 👌

## [6.3.1] - 2021-09-04

### Fixed

- Another attempt at making "Move to existing file" work on Windows OS.
- Abracadabra now preserves tabs when you use "Rename Symbol" in a `.vue` file. No more converting the indentation to spaces 😁
- Following up with "Rename Symbol" in Vue files, Abracadabra will now explicitly tell you when it can't rename the identifiers that are used in templates, for instance.

That is a great opportunity for a reminder!

While refactorings can be executed in `.vue` files, please keep in mind that the scope is limited to the `<script>` tag. This is more like a workaround for Vue developers until an extension like Vetur implements these 🙂

## [6.3.0] - 2021-09-02 - Ev'rybody Wants to Be a File 😺

### Fixed

- Make "Move to existing file" works on Windows OS.

### Changed

- Extract Type now works on TS `as` expressions too!
- Remove Redundant Else now supports if statements that have no braces. That scenario can typically result from another refactoring. Being able to chain refactorings is nice, isn't it?
- Merge if-statements can now consolidate `if/else-if` that have the same body.

## [6.2.0] - 2021-08-24 - A Spoonful of Inline 🥄

### Fixed

- Inline Variable used to break code when executed on multi-lines JSX. That's because it would have missed the closing parenthesis. Not anymore! We're catching the whole declaration node properly 🧹

### Changed

- Inline Variable now produces cleaner code when inlining JSX Elements. No more unnecessary `{}` wrapping the inlined variable.
- Merge if-statements now works for consecutive ifs that have the same return value.

```js
// Now, this code can quickly be refactored…
function disabilityAmount(anEmployee) {
  if (anEmployee.seniority < 2) return 0;
  if (anEmployee.monthsDisabled > 12) return 0;
  if (anEmployee.isPartTime) return 0;

  return 100;
}

// Into this code 👇
function disabilityAmount(anEmployee) {
  if (
    anEmployee.seniority < 2 ||
    anEmployee.monthsDisabled > 12 ||
    anEmployee.isPartTime
  ) {
    return 0;
  }

  return 100;
}
```

## [6.1.1]

Fixed an issue with CI so we can deploy. No user-facing change.

## [6.1.0] - 2021-08-11 - Remember Me 🎸

### Fixed

- Abracadabra couldn't parse the AST of `.vue` files that were using attributes in the `<script>` tag (e.g. `<script lang="ts">`). Now it can!

### Added

- Convert to Arrow Function now handles Function Expressions too. That means more patterns can be converted, which is more intuitive.

## [6.0.0] - 2021-07-21 - Shiny 🦀

### Removed (= Breaking)

- All add/remove braces refactorings that have been merged into "Toggle Braces":

  1. Add Braces to If Statement
  2. Add Braces to Arrow Function Expression
  3. Add Braces to JSX Attribute
  4. Remove Braces from If Statement
  5. Remove Braces from Arrow Function Expression
  6. Remove Braces from JSX Attribute

### Added

- **[New Refactoring]** Toggle Braces now combines all previous add/remove braces refactorings we used to have. It reduces the noise and makes it easier to switch between curly braces or not.

### Fixed

- Inline Function was breaking code in some scenarios, which has been fixed. Props to @qpwo for raising it up 🙏

## [5.4.2] - 2021-07-06

### Fixed

- Extract Variable now works fine on member expressions that use optional chaining (e.g. `some?.data?.value`).
- Fix a warning with `splitMultipleDeclarations` that wasn't properly declared to VS Code. Thanks @tjx666 for spotting it 👍
- Inline Variable now works fine for TS declarations that are type casted with `as`.

```ts
// Inlining `saveButton` would produce broken code
// Not anymore!
const saveButton = document.getElementById("btnSave") as HTMLButtonElement;
saveButton.disabled = true;
```

Thanks to @nicolasff for reporting this one!

## [5.4.1] - 2021-06-20

No change for the extension. It's an internal fix to get Abracadabra deployed to VS Code again.

### Fixed

- Fix VS Code release due to [a breaking change](https://github.com/microsoft/vscode-vsce/issues/576) in the latest vsce version.

## [5.4.0] - 2021-06-20 - Into the Exported Air 🎯

### Fixed

- Inline Variable was not respecting boundaries set by a lambda expression. It would replace all identifiers with the same name, despite them being redefined in the arrow function params. That created broken code. Not anymore! Thanks, @gurdiga for reporting!
- Convert let to const was wrongly suggested as a quick fix for every `const` declaration. Some `isLet()` logic was broken and we fixed that! Props to @jonboiser for spotting it.

### Added

- Convert to Arrow Function now works on exported function declarations.

## [5.3.1] - 2021-05-20

### Fixed

TL;DR Extract Variable now works "as expected" in more edge-cases!

- Extract Variable now doesn't consider the left-side of assignment expressions as an occurrence. This means if you have code like `data.value = "(" + data.value + ")"` and you extract the second occurrence of `data.value`, it won't try to replace the `data.value` on the left (that could break your code).
- Extract Variable now puts the cursor properly when you extract member expressions but there were other occurrences on the same line that you don't extract.

## [5.3.0] - 2021-04-29 - Code Is a Highway 🏎

### Fixed

- Extract Variable won't extract type parameter instantiations anymore, because it shouldn't!
- Split Declaration from Initialization now works fine with destructured assignments.

### Added

- Move to Existing File now works with types and interfaces! So you can move these to an existing source file.
- A new setting `abracadabra.ignoredPatterns` that you can use to disable the extension Quick Fixes in specified glob patterns. Default is `["build/*", "dist/*"]`. `abracadabra.ignoredFolders` still exist, although it's redundant. It will eventually be removed later in favor of `ignoredPatterns`.

### Changed

- Performances have been improved by running less often the refactorings in the background to determine if we can propose a quick fix. It should make VS Code faster when you're working on a large file.

## [5.2.0] - 2021-04-15 - Poor Unfortunate Types 🦑

### Fixed

- Converting a ternary assigned to a variable used to remove other eventual declarations. Now, it won't proceed with the refactoring (not supported yet).

```ts
// These nested ternaries can't be converted anymore.
// So at least, it won't break your code!
const someValue = isValid ? "first" : "second",
  prefix = isValid ? "f-" : "s-";
```

- Extract Generic Type used to wrongly replace all type aliases in the signature instead of the identical ones. It's fixed so it's now more reliable to use.

### Changed

- Ternaries assigned to variables can now be converted when you select the whole declaration.
- Extract Type now works on union types (`A | B`) and intersection types (`A & B`). It will extract what's closest to your selection, so you can extract the whole type or a part of it.
- Extract Type will also work with nested types like so:

```ts
let response: { body: { data: string } };

// Cursor on `string`
// Extract Type will produce the following result:
type Extracted = string;
let response: { body: { data: Extracted } };
```

- Convert to ForEach used to insert a blank line if there was a line directly above the for-loop. Now it won't!

## [5.1.0] - 2021-04-03 - Join the Herd 🐾

### Fixed

- Extract Type will now puts the cursor at the proper position to rename the extracted type when leading comments are present. Thanks @fabien0102 for catching this!
- Extracting multiple variables on the same line will correctly position the cursor to trigger a rename. That was an annoying edge-case, not anymore!

### Changed

- @chrstnbrn improved error messages for when the AST can't be built. That should help you understand what went wrong when things don't work 👍
- Convert to Arrow Function will only prompt a quick fix if your cursor is on the function declaration, not its body. This will reduce the noise when working with large functions.
- Extract Variable will re-use existing destructured declaration. So for this code:

```ts
function test(obj) {
  return obj.x + obj.y * obj.x + obj.y;
}
```

After extracting `x` and `y` (and choosing to "destructure" it) the end result will now be:

```ts
function test(obj) {
  const { x, y } = obj;
  return x + y * x + y;
}
```

- @ZakMiller made "Convert for to forEach" works with for..of loops too. Nice!

## [5.0.1] - 2021-03-08

### Fixed

- Attempting to extract a variable was hijacked with the new Extract Type refactoring. This is fixed so we can now execute both again!

## [5.0.0] - 2021-03-04 - Typing In the Name 🤖

### Changed

- **(Breaking)** Extract Generic Type can't be triggered with `Ctrl + Alt + V` anymore. We assigned this shortcut to the new Extract Type refactoring instead (more intuitive). This refactoring is now available through a Quick Fix though 💡

### Added

- **[New Refactoring]** Extract Type! It works exactly like Extract Variable, but for types. Even more convenient: the shortcut is the same (`Ctrl + Alt + V` / `⌥ ⌘ V` on MacOS). If you're on a _variable_, it will extract the _variable_. If you're on a _type_, it will extract the _type_ 😉
- **[New Refactoring]** Split Multiple Declarations, to create distinct variable declarations from a single one. Thanks to @iulspop for this one!

### Fixed

- Split Declaration and Initialization would duplicate type annotations in TypeScript. @iulspop fixed that 🔥

## [4.13.1] - 2021-01-10

No user-facing change. Configuration was fixed so the extension can be deployed again.

## [4.13.0] - 2021-01-10 - Moves Like Function 🎬

### Added

- **[New Refactoring]** Move to _existing_ file. Long-time awaited feature and a nice complement to VS Code's native "Move to new file". It only works for function declarations (for now).

### Fixed

- Extract Variable resulted in broken code when executed on the condition of an `else` statement. The variable declaration was inserted in the middle of the if statement: not good. This is solved now!
- Convert to Arrow Function would not work if some imported types were used before the function declaration. That was weird, but it has been fixed 😄

## [4.12.1] - 2020-12-07

### Fixed

- Extract Variable now find the correct scope when the only common ancestor is the Program. So extracting these `"hello"` will now generate the correct code:

```js
if (isValid) {
  console.log("hello");
} else {
  console.log("hello");
}

// 🚫 Used to generate:
if (isValid) {
  const hello = "hello";
  console.log(hello);
} else {
  console.log(hello);
}

// ✅ Will now generate:
const hello = "hello";
if (isValid) {
  console.log(hello);
} else {
  console.log(hello);
}
```

- Extract Variable won't suggest a name that would shadow a binding in scope. That should prevent breaking code when the string literal you want to extract has the same value than an existing variable.

```js
function greeting(extracted, hello) {
  console.log("hello", extracted, hello);
}

// 🚫 Used to generate:
function greeting(extracted, hello) {
  const hello = "hello";
  console.log(hello, extracted, hello);
}

// ✅ Will now generate:
function greeting(extracted, hello) {
  const extracted1 = "hello";
  console.log(extracted1, extracted, hello);
}
```

It also means you can extract multiple variables

- Prevents "Convert to Arrow Function" to be executed on code if function is referenced above. This is because generated code would be invalid since the function declaration wouldn't be hoisted anymore.

## [4.12.0] - 2020-11-28 - Hide and Seek 🙈

### Added

- You can now hide refactorings from Quick Fix suggestions!

There are over 30 refactorings supported by the extension now, and you may not be using all of them. If you want to reduce the noise, you can now disable the suggestions you don't use from [VS Code settings](https://code.visualstudio.com/docs/getstarted/settings).

### Changed

- "Convert to Arrow Function" used to convert the top-most function declaration, which was unexpected when you have nested ones! It now converts function that's the closest to the cursor position.

## [4.11.0] - 2020-11-19 - The Vue has Changed 👩‍🚀

### Added

- Rename Symbol now works on `.vue` files. The UX is slightly different as we didn't managed to get the input pop next to the renamed symbol, but it's very similar to what you can do in any other language.

This means other refactorings like "Extract Variable" are now smoother in `.vue` files, since they rely on "Rename Symbol" to reduce the amount of keystrokes you need to do!

It works when you press `F2` like anywhere else.

## [4.10.0] - 2020-11-16 - Block to be Alive 🐶

### Changed

- Negate Expression quick fix stops saying "(use null instead)" when it can't compute the negated operator
- Inline Variable now works on computed properties, so this would work:

```ts
// Inline `name` will now work…
const name = "John";
console.log({ [name]: "Doe" });

// … and generate this code:
console.log({ ["John"]: "Doe" });
```

### Fixed

- Extract Variable now works fine when executed inside block statements and it matches multiple occurrences. It means that this code:

```js
function venueBtnName() {
  if (window.location.href.includes("raw")) {
    document.getElementById("venueExampleBtn").innerHTML = "Venue Examples";
  } else {
    document.getElementById("venueExampleBtn").innerHTML =
      "Venue Group Details";
  }
}
```

Will produce this code, as expected:

```js
function venueBtnName() {
  const extracted = document.getElementById("venueExampleBtn");
  if (window.location.href.includes("raw")) {
    extracted.innerHTML = "Venue Examples";
  } else {
    extracted.innerHTML = "Venue Group Details";
  }
}
```

## [4.9.3] - 2020-11-05

### Fixed

- Flip ternary now works correctly with `instanceof` and `in` operators
- Extract Variable stop asking for destructuring strategy when member expression is computed

## [4.9.2] - 2020-10-22

> No change in the extension itself.

Abracadabra is now deployed to [the Open VSX Registry](https://open-vsx.org/), making it available for VS Code alternatives as [VS Codium](https://vscodium.com/).

## [4.9.1] - 2020-10-22

### Fixed

- Extract Class now handles classes that implement multiple interfaces

## [4.9.0] - 2020-10-17 - Extract Class Hero 🐄

### Added

- **[New Refactoring]** Extract Class, such a useful refactoring implemented by @justerest 🙏

### Changed

- Extracting a member expression used to destructure it by default. But sometimes, it's not convenient. Consider the following code:

```ts
console.log(a1.length + a2.length);
```

If you want to extract both `length`, you'll end up with such code:

```ts
const { length: a1Length } = a1;
const { length: a2Length } = a2;
console.log(a1Length + a2Length);
```

It's a bit verbose. Now, in such case, you'll be prompt whether you want to destructure or not. So you can easily extract variables into this:

```ts
const a1Length = a1.length;
const a2Length = a2.length;
console.log(a1Length + a2Length);
```

### Fixed

- Some string literals couldn't be correctly extracted if they matched reserved words like `return` or `class`. This is now fixed!

## [4.8.0] - 2020-09-10 - Vue.js Killed The Radio Star 📻

### Changed

- "Convert to Arrow Function" now preserves comments.

- Refactorings used to mess up with Interperter Directives (aka Shebangs). Not anymore! For example, "Convert to Arrow Function" used to turn:

```js
#!/usr/bin/env node

function test() {}
```

Into this:

```js
#!/usr/bin/env nodeconst test = () => {}
```

Now it works as expected:

```js
#!/usr/bin/env node

const test = () => {};
```

### Added

- **Support for `.vue` files**. You can now run automated refactorings within the `<script>` tags of your single-file component ✨

## [4.7.0] - 2020-08-28 - I like to Move it, Move it 🇲🇬

### Changed

- "Move Statements" UX got some love with 3 great improvements:

  1. The editor scrolls only when it's necessary
  2. It doesn't move the parent node unexpectedly!
  3. Cursor ends up more often at the expected position

- "Bubble up If Statement" has been renamed "Lift Up Conditional", which is the most widespread name for this refactoring

### Added

- "Move Statements" now handles array elements the same way it handles object properties
- **[New Refactoring]** Convert to Arrow Function, thanks to @OliverJAsh 🙏

## [4.6.0] - 2020-07-30 - I was made for Refactorin' you baby 💋

### Changed

- "Negate Expression" now generates simpler logical expressions, as you'd expect.

```js
// If you put cursor on `!isVIP` and trigger `Negate the expression`
if (!isValid && !isSelected && !isVIP) {
}

// Before, valid but uselessly complex 🤯
if (!(!(!isValid && !isSelected) || isVIP)) {
}

// After, much better 👌
if (!(isValid || isSelected || isVIP)) {
}
```

- "Flip If/Else" now generates guard clauses when possible.

```js
// If you put cursor on the if statement and trigger "Flip if/else"
function sayHello(isMorning) {
  sayHi();

  if (isMorning) {
    sayHowAreYouDoing();
  }
}

// Before, valid but uselessly complex 🤯
function sayHello(isMorning) {
  sayHi();

  if (!isMorning) {
  } else {
    sayHowAreYouDoing();
  }
}

// After, much better 👌
function sayHello(isMorning) {
  sayHi();

  if (!isMorning) return;
  sayHowAreYouDoing();
}
```

### Added

- "Convert If/Else to Ternary" now handles more complex assignments.
- "Extract Variable" now works on default exports too.

### Fixed

- "Negate Expression" stopped showing up in Quick Fixes for a while. This is now fixed!

## [4.5.0] - 2020-07-10 - We all extract a yellow Substring ⚓

### Added

- "Extract Variable" now extracts substring if that's what you selected!

It will convert the string into a template literal accordingly. It doesn't work with multi-lines template literals yet, but it's already very convenient!

![][demo-extract-substring]

### Fixed

- "Extract Variable" now resolves the earliest common ancestor of multiple occurrences that wouldn't be in the same scope. That means there's now less cases where an extraction would be invalid!

- Update the Quick Fixes labels to put "✨" at the end. This allows you to use your keyboard to select a Quick Fix, as it's standard OS behavior. Thanks @OliverJAsh for reporting this accessibility issue!

## [4.4.0] - 2020-06-13 - Let It Be 🌸

### Added

- **[New Refactoring]** Convert let to const, thanks to @nickebbitt for this one!
- "Extract Variable" now works on thrown errors too!

### Fixed

- "Remove Dead Code" was broken when dealing with conditionals without braces.
- "Flip If/Else" was broken with non-negatable operators like `instanceof`. It flips the condition correctly now!
- Tabs are now preserved. Some refactorings used to replace them with spaces. No more 🤠

## [4.3.0] - 2020-05-18 - Make it Generic vol. 2 🏭

### Added

- "Extract Generic Type" now works on function declarations.

## [4.2.0] - 2020-05-01 - Make it Generic 🏭

### Added

- **[Extract Generic Type]** To turn TS types into generics with a simple shortcut. Works like "Extract Variable".

![][demo-extract-generic-type]

It's limited to interfaces for now.

- **[Convert Switch to If/Else]** To reverse _Convert If/Else to Switch_ refactoring. Thanks to @delaaxe.

![][demo-convert-switch-to-if-else]

### Fixed

- Extract the instantiated class instead of the Identifier when cursor is on Identifier. Given this code:

```js
console.log(new Error("It failed"));
```

With the cursor on `Error`, previous version of Abracadabra would have produced:

```js
const extracted = Error;
console.log(new extracted("It failed"));
```

Which is not what you'd expect. Thus, it will now produce:

```js
const extracted = new Error("It failed");
console.log(extracted);
```

## [4.1.0] - 2020-04-09 - Back in Black 🎸

### Added

- Get "Convert to Template Literal" back for the only scenario VS Code doesn't handle natively: simple strings. So you can convert a simple string into a template literal again, which is really convenient!

### Fixed

- Quick Fixes used to log errors when code couldn't be parsed. This is not useful, so they don't anymore!

## [4.0.1] - 2020-04-09

### Fixed

- "Extract Variable" didn't worked on object properties with long key names. So this code:

```js
const component_context = {
  someVeryLongPropertyNameThatWontFit: doSomething()
};
```

Would produce this, invalid code:

```js
const extracted = doSomething();
const component_context = {
  someVeryLongPropertyNameThatWontFit
};
```

This is now fixed and it will produce the expected code:

```js
const someVeryLongPropertyNameThatWontFit = doSomething();
const component_context = {
  someVeryLongPropertyNameThatWontFit
};
```

- "Extract Variable" didn't worked on object properties when key was a string like:

```js
const component_context = {
  "hello.world": doSomething()
};
```

That is now fixed!

## [4.0.0] - 2020-03-30 - Cover up that folder… 🙈

### Removed (= Breaking)

- Removed "Convert to Template Literal" refactoring. This is now natively include in VS Code with a similar, great developer experience (e.g. you can trigger the Quick Fix wherever your cursor is). We're happy of this and there's no point in providing a duplicate implementation of it 👐

### Changed

- **(Breaking)** [We stopped proposing][adr-0008] "Convert to Pure Component" as a Quick Fix. The refactoring can still be executed through the Command Palette.
- **Improved the extension performances** when proposing Quick Fixes, thanks to @visusnet hard work! Since that occurs anytime you move the cursor, it makes a great difference for your machine. Especially if you work on large files 🚀

### Added

- **[New Refactoring]** Remove Braces from If Statement, thanks to @automatensalat
- A new setting `abracadabra.ignoredFolders` that you can use to disable the extension Quick Fixes in specified folders. Default is `["node_modules", "build", "dist"]`.

### Fixed

- "Merge if statements" and "Add braces to if statements" were proposed, even when the refactoring was not applicable. This is now fixed.

## [3.2.3] - 2020-03-19

<details>

### Fixed

- Extract Variable didn't worked correctly if indentation included tabs. This is now fixed!

</details>

## [3.2.2] - 2020-03-12

<details>

### Fixed

- Upgrade babel to make the extension work with TypeScript 3.8 syntax, such as top-level awaits. Thanks @David-Else [for reporting this](https://github.com/nicoespeon/abracadabra/issues/75) 🙏

</details>

## [3.2.1] - 2020-02-20

<details>

### Fixed

- Extract Variable didn't worked properly with empty string and special keywords. This is now fixed!
- Extract Variable didn't worked properly for non-camel case properties. E.g. `path.some_node.value` would wrongly extract `const { someNode } = path`. Now it will correctly compute `const { some_node } = path`.

</details>

## [3.2.0] - 2020-01-30 - The Class Without an Interface 🎭

<details>

### Fixed

- Convert to Template Literal now works on JSX attributes which were not already wrapped with braces. Concretely, `<MyComponent prop="test" />` will now produce `<MyComponent prop={`test`} />` instead of failing.
- Don't propose Convert to Template Literal on imports

### Added

- **[New Refactoring]** Add Braces to JSX Attribute
- **[New Refactoring]** Remove Braces from JSX Attribute
- **[New Refactoring]** Extract Interface _(TS specific)_

</details>

## [3.1.0] - 2020-01-14 - Keep 'em simple 🌱

<details>

### Added

- **[New Refactoring]** Simplify Ternary
- **[New Refactoring]** Add Braces to If Statement

</details>

## [3.0.0] - 2019-12-19 - Finding good shortcuts is hard 🤪

<details>

### Added

- **[New Refactoring]** Convert to Pure Component _(React specific)_

### Changed

- **(Breaking)** So… Move Statement Up/Down keybinding was conflicting with VS Code native shortcuts on Mac OS too. It was `⌘ ⇧ ↑/↓`, now it's `Alt + Shift + U / D` for everyone.

#### Extract Variable now destructures member expressions properties

Consider the following code:

```js
console.log(session.user.address);
```

Before, extracting `address` would have produced:

```js
const address = session.user.address;
console.log(address);
```

This was fine… But it could be optimized. From our own experience, we always destructure the `address` property after the extraction.

Thus, from now on, extracting `address` will produce:

```js
const { address } = session.user;
console.log(address);
```

Since you end up renaming the symbol, you can provide a different name than `address` and it will work.

### Fixed

- Don't Convert For-Loop to ForEach if counter doesn't start from 0

</details>

## [2.0.0] - 2019-12-12 - A better shortcut 🛣

<details>

### Changed

- **(Breaking)** Changed keybinding of Move Statement Up/Down on Windows and Linux since it conflicts with VS Code native shortcuts. It was `Ctrl + Shift + ↑ / ↓`, now it's `Alt + Shift + U / D`
- Configure `Alt ↵` keybinding to trigger VS Code Quick Fixes, so it's more convenient to use the extension by default.

#### Convert If/Else to Ternary handles implicit else return statements

Useful when dealing with guard clauses patterns.

Consider the following code:

```js
function calculateYear(selectedDates) {
  if (selectedDates[0].getMonth() === 0) {
    return selectedDates[0].getFullYear() - 1;
  }

  return selectedDates[0].getFullYear();
}
```

Before this change, you couldn't convert this to a ternary directly, since the else statement is not explicit. But it's still here. It's a typical guard clause pattern.

Now, Abracadabra will recognize this pattern and it will produce the expected code:

```js
function calculateYear(selectedDates) {
  return selectedDates[0].getMonth() === 0
    ? selectedDates[0].getFullYear() - 1
    : selectedDates[0].getFullYear();
}
```

### Fixed

- Inline Variable now handles destructured "this" expressions correctly (e.g. you can inline `const { id } = this.user`).

</details>

## [1.2.1] - 2019-11-30

<details>

### Fixed

- Fix cursor position after Extract Variable that creates a shorthand on an object property that ends with a comma, so rename works
- Stop proposing Negate Expression quick fix on single call expressions, since the negated expression is identical
- Remove double-negations after running Negate Expression on a multi-line expression

</details>

## [1.2.0] - 2019-11-28 - Big head, shorthand 🦖

<details>

### Changed

#### Extract Variable creates shorthand object properties

Consider the following code:

```js
console.log({
  foo: "bar"
});
```

Before, extracting the `"bar"` string literal would have produced:

```js
const extracted = "bar";
console.log({
  foo: extracted
});
```

This worked. But in practice, we realized that we continue modifying the code manually to get there:

```js
const foo = "bar";
console.log({
  foo
});
```

So now, this is what _Extract Variable_ will generate by default. Obviously, you'll have the capability to rename `foo` directly, so you can adapt the name if you want to provide another one.

We believe this will make extracting object properties even more fluid.

### Fixed

- Extract Variable won't extract type annotation as it doesn't handle them properly yet.

</details>

## [1.1.0] - 2019-11-21 - Keep movin' 🏃‍♀️

<details>

### Changed

- Extract Variable now extracts JSX Attributes (e.g. `<Header title="Home" />` will extract `"Home"` if cursor is on it).
- Extract Variable now suggest a better variable name when you extract member expressions (e.g. `const name = this.props.location.name` instead of `const extracted = this.props.location.name`).
- Move Statements now work on object methods, class methods and class properties!

### Fixed

- Extract Variable don't suggest an invalid variable name when extracting a string starting with a number.
- Stop jumping cursor to the end of the file when performing some refactorings. That was a regression introduced when we improve cursor scrolling on Move Statements, in v1.0.0 😅

</details>

## [1.0.1] - 2019-11-18

<details>

### Fixed

- Inline Variable now works correctly for destructured objects with a computed identifier (e.g. `const { id } = session.users[key]`).

</details>

## [1.0.0] - 2019-11-15 - Officially stable 🎩

**Abracadabra is now stable enough to be considered v1 🎉✨🎩**

<details>

### Fixed

- Cursor position after "Move Statements" is now more accurate.
- VS Code now scrolls to the moved statement, so we don't loose track of it!

## [0.11.0] - 2019-11-13 - Refactor Barry, Refactor ⚡

### Changed

#### Improve Quick Fixes performances

We've optimized the way we determine which refactorings can be executed **at your current cursor position**. This is an Abracadabra key feature.

Every time you move your cursor on the code, we propose you the relevant refactorings through the VS Code Quick Fixes (aka, the lightbulb 💡). This process was taking quite some time, which was causing 2 issues:

1. On large files (> 1000 LOC), it would take many seconds to propose you anything. This is lon. And let's be honest, legacy code we're dealing with frequently comes as large files we want to refactor.
2. Each new refactoring was adding a bit more of computing. Today, that's around 20 refactorings. If we want to add more, we add to improve performances first, so the extension stays usable.

In short, 2 things were improved:

1. We now only parse the code once, instead of each refactoring parsing the code again.
2. We shortcut the refactoring execution, so we save a bunch of time on the transformation part too.

As for every performance optimization, you need to measure it or it didn't happen! Overall, here's what it looks like:

| File size         | Execution time _before_ | Execution time _after_ | Gain                      |
| ----------------- | ----------------------- | ---------------------- | ------------------------- |
| Small (70 LOC)    | 200ms                   | 40ms                   | -80%, **5 times faster**  |
| Large (2.400 LOC) | 6s                      | 350ms                  | -94%, **17 times faster** |

#### Move Statements now handles one-liners more intuitively

Consider following code:

```js
const user = {
  firstName: "John",
  lastName: "Doe",
  age: 24
};
const rights = { admin: false, moderator: true };
```

Before, if you had the cursor on `admin` and you tried to move the statement up, you'd have swapped the parameters:

```js
const user = {
  firstName: "John",
  lastName: "Doe",
  age: 24
};
const rights = { moderator: true, admin: false };
```

But what you probably intended to do was to swap the two variable declarations. From usage, we think "Move Statements" more as something you'd like to use to move things up or down. If things are at the same line, you certainly don't expect them to move.

The behaviour was surprising, so it was improved. Now, the same operation will generate:

```js
const rights = { admin: false, moderator: true };
const user = {
  firstName: "John",
  lastName: "Doe",
  age: 24
};
```

However, if your cursor is now on `lastName` and you move the statement down, it will still produce the following code since statements are on different lines:

```js
const rights = { admin: false, moderator: true };
const user = {
  firstName: "John",
  age: 24,
  lastName: "Doe"
};
```

Noticed how it handles the trailing comma? Ok, that was already here. But it's still super neat!

</details>

## [0.10.0] - 2019-10-27 - Can't type this 🕺

<details>

### Changed

#### Inline Variable now handles Type Aliases

Consider the following TypeScript code:

```ts
type Value = "one" | "many" | "none";

interface Something {
  value: Value;
}
```

You can now inline the `Value` type just like a regular variable. Inlining it will result in following code:

```ts
interface Something {
  value: "one" | "many" | "none";
}
```

#### Merge else-if is more intuitive

Consider the following nested if statements:

```js
if (isValid) {
  doSomething();
} else {
  if (shouldDoSomething) {
    doSomethingElse();
  } else {
    if (isCorrect) {
      doAnotherThing();
    }
  }
}
```

If your cursor is on the nested `if (shouldDoSomething)` and you want to execute "✨ Merge else-if" quick fix, then you'd expect this if to be merged with the previous one.

However, because of the nested `if (isCorrect)`, the actual output would have been:

```js
if (isValid) {
  doSomething();
} else {
  if (shouldDoSomething) {
    doSomethingElse();
  } else if (isCorrect) {
    doAnotherThing();
  }
}
```

We improved the UX to be more intuitive. So if your cursor is on `if (shouldDoSomething)`, we'll prioritize the parent merge and the result would be:

```js
if (isValid) {
  doSomething();
} else if (shouldDoSomething) {
  doSomethingElse();
} else {
  if (isCorrect) {
    doAnotherThing();
  }
}
```

### Fixed

- Extract Variable with arrays of different length now matches other occurrences correctly.

</details>

## [0.9.0] - 2019-10-17 - Let me guess your name 🔮

<details>

### Changed

#### Inline Variable now handles destructured array patterns

Consider the following code:

```js
const [firstName] = names;
console.log(firstName);
```

If you tried to inline `firstName`, it wouldn't work because destructured array patterns were not supported.

Now it would work as expected:

```js
console.log(names[0]);
```

That means Inline Variable now handles all kind of destructured variables. Making it much more flexible and handy!

#### Extract Variable infers variable name on String Literals

Consider the following code:

```js
console.log("Hello World!");
```

If you extracted `"Hello World!"`, you would end up with the following code:

```js
const extracted = "Hello World!";
console.log(extracted);
```

And you'll be renaming the `extracted` symbol. Which is a quick and efficient way to extract the variable.

But now, it'll try to do a bit better. Now, you'll end up with:

```js
const helloWorld = "Hello World!";
console.log(helloWorld);
```

Which would make sense in that case, saving you the trouble of naming it!

Now, predicting the variable name is **hard**. Thus, you'll still be in "renaming mode", so it doesn't really matter if the guess is wrong. If it's correct though, it will certainly save you some more time in your refactoring, and that's the goal!

One last thing: if the inferred name is too long (> 20 characters), it will default on `"extracted"` because it's probably not a good name for your variable.

### Fixed

- All refactorings Quick Fixes used to appear on Windows because of EOL. Not anymore!

</details>

## [0.8.0] - 2019-09-22 - I see dead code 💀

<details>

### Added

- **[New Refactoring]** Remove Dead Code
- **[New Refactoring]** Convert For-Loop to ForEach

### Changed

#### Inline Variable now handles destructured object patterns

Consider the following code:

```js
const { userId } = session;
messages.map((message) => ({ userId }));
```

If you tried to inline `userId`, it wouldn't work because destructured object patterns were not supported.

Now it would work as expected:

```js
messages.map((message) => ({ userId: session.userId }));
```

Thanks to @noway for [bringing this one up](https://github.com/nicoespeon/abracadabra/issues/25).

Destructured array patterns (e.g. `const [userId] = session`) are still not supported, but we're working on it.

### Fixed

- Convert If/Else to Ternary now preserve comments that were inside each branches.

</details>

## [0.7.0] - 2019-09-16 - Switch it on! 🔦

<details>

### Added

- **[New Refactoring]** Convert If/Else to Switch
- **[New Refactoring]** Merge With Previous If Statement

### Changed

#### Split Declaration and Initialization now handles nested declarations

Consider the following code:

```js
const getLastName = () => {
  const lastName = "Doe";
  return lastName;
};
```

If your cursor is on `const lastName`, executing the refactoring would have produced this result before:

```js
let getLastName;

getLastName = () => {
  let lastName;
  lastName = "Doe";
  return lastName;
};
```

Refactoring would have been applied to both declarations. It's valid, but probably not want you wanted to do.

Now it will produce the following, expected output:

```js
const getLastName = () => {
  let lastName;
  lastName = "Doe";
  return lastName;
};
```

### Fixed

- Flip If/Else now works when both if and else branches have return statements
- Inline Function now preserves comments as much as possible

</details>

## [0.6.0] - 2019-09-08 - Bubble it up 🐠

<details>

### Added

- **[New Refactoring]** Bubble up If Statement

### Changed

#### Merge If Statements now handles `else-if`s

![][demo-merge-if-statements-else-if]

#### Extract Variable handles Spread Elements better

Consider the following snippet:

```js
console.log({ ...foo.bar });
```

Before, executing _Extract Variable_ with the cursor of `foo` would have produced:

```js
const extracted = { ...foo.bar };
console.log(extracted);
```

Now, you can extract the Spread Element. The result will be:

```js
const extracted = foo.bar;
console.log({ ...extracted });
```

If your cursor is on the `...` symbol however, you will still extract the whole thing.

</details>

## [0.5.0] - 2019-08-25 - Extract 'em all 🤙

<details>

### Added

- **[New Refactoring]** Replace Binary with Assignment

### Changed

#### Extract Variable now handles extraction of multiple occurrences!

If the extracted variable has no other occurrence in scope, it will just perform the extraction as it does today.

But if we can find other occurrences of the variable in the scope, then it will ask you what you want to do:

1. "Replace all N occurrences". This is the default since it's what we want to do most of the time.
1. "Replace this occurrence only". In case you only want to extract this one.

![][demo-extract-variable-multiple-occurrences]

### Fixed

- Extract Variable now works for call expressions in JSX Elements (e.g. `<Button onClick={this.extractMe()} />`)
- Extract Variable now works in for statements

</details>

## [0.4.0] - 2019-08-18 - Here come the Guards 💂‍♀️

<details>

### Changed

#### Flip If/Else now works better on [guard clause][guard-clause] patterns

Consider this guard clause example:

```js
function doSomething(someData) {
  if (!isValid(someData)) {
    return;
  }

  // … rest of the code
}
```

Before, running _Flip If/Else_ would have produced:

```js
function doSomething(someData) {
  if (isValid(someData)) {
  } else {
    return;
  }

  // … rest of the code
}
```

Which is valid, but probably not what you had in mind.

Now, it would produce the following result:

```js
function doSomething(someData) {
  if (isValid(someData)) {
    // … rest of the code
  }
}
```

### Fixed

- Inline Function now says it can't inline function with many statements to assigned call expressions
- Inline Function now works on return statements identifiers (e.g. `return inlineMe;`)
- Inline Function now works on every call expression that is:
  - assigned to a variable (e.g. `const result = isValid ? inlineMe() : "default";`)
  - inside another call expression (e.g. `console.log(inlineMe())`)
  - inside an arrow function expression (e.g. `() => inlineMe()`)
- Extract Variable on JSX Elements now triggers symbol rename as expected
- Extract Variable now works on `JSXText`s

</details>

## [0.3.0] - 2019-08-10 - Y U no use template strings? 😫

<details>

### Added

- **[New refactoring]** Convert to Template Literal
- **[New refactoring]** Split Declaration and Initialization

### Fixed

- Don't add unnecessary braces when extracting JSX elements.
- Don't extract arrow function expressions params.
- Remove Redundant Else now handles nested _If_ statements correctly.
- Flip Ternary now handles nested ternaries correctly.
- Flip If/Else now handles nested _If_ statements correctly.

</details>

## [0.2.0] - 2019-08-05 - Let me Inline this for you 🧙‍♂️

<details>

### Added

- **[New refactoring]** Inline Function
- **[New refactoring]** Merge If Statements

</details>

## [0.1.0] - 2019-07-23 - Brace(s) yourself… ❄️

<details>

### Fixed

- Inline Variable with object shorthand properties

### Added

- Move Statement Up/Down now work on object properties too
- **[New refactoring]** Split If Statement
- **[New refactoring]** Remove Braces from Arrow Function
- **[New refactoring]** Add Braces to Arrow Function

</details>

## [0.0.1] - 2019-07-09 - First publication, first refactorings ✨

<details>

### Added

- **[New refactoring]** Move Statement Down
- **[New refactoring]** Move Statement Up
- **[New refactoring]** Convert Ternary to If/Else
- **[New refactoring]** Convert If/Else to Ternary
- **[New refactoring]** Flip Ternary
- **[New refactoring]** Flip If/Else
- **[New refactoring]** Remove Redundant Else
- **[New refactoring]** Negate Expression
- **[New refactoring]** Inline Variable
- **[New refactoring]** Extract Variable
- **[New refactoring]** Rename Symbol

</details>

[unreleased]: https://github.com/nicoespeon/abracadabra/compare/9.1.2...HEAD
[9.1.2]: https://github.com/nicoespeon/abracadabra/compare/9.1.1...9.1.2
[9.1.1]: https://github.com/nicoespeon/abracadabra/compare/9.1.0...9.1.1
[9.1.0]: https://github.com/nicoespeon/abracadabra/compare/9.0.2...9.1.0
[9.0.2]: https://github.com/nicoespeon/abracadabra/compare/9.0.1...9.0.2
[9.0.1]: https://github.com/nicoespeon/abracadabra/compare/9.0.0...9.0.1
[9.0.0]: https://github.com/nicoespeon/abracadabra/compare/8.1.4...9.0.0
[8.1.4]: https://github.com/nicoespeon/abracadabra/compare/8.1.3...8.1.4
[8.1.3]: https://github.com/nicoespeon/abracadabra/compare/8.1.2...8.1.3
[8.1.2]: https://github.com/nicoespeon/abracadabra/compare/8.1.1...8.1.2
[8.1.1]: https://github.com/nicoespeon/abracadabra/compare/8.1.0...8.1.1
[8.1.0]: https://github.com/nicoespeon/abracadabra/compare/8.0.1...8.1.0
[8.0.1]: https://github.com/nicoespeon/abracadabra/compare/8.0.0...8.0.1
[8.0.0]: https://github.com/nicoespeon/abracadabra/compare/7.1.1...8.0.0
[7.1.1]: https://github.com/nicoespeon/abracadabra/compare/7.1.0...7.1.1
[7.1.0]: https://github.com/nicoespeon/abracadabra/compare/7.0.0...7.1.0
[7.0.0]: https://github.com/nicoespeon/abracadabra/compare/6.19.0...7.0.0
[6.19.0]: https://github.com/nicoespeon/abracadabra/compare/6.18.2...6.19.0
[6.18.2]: https://github.com/nicoespeon/abracadabra/compare/6.18.1...6.18.2
[6.18.1]: https://github.com/nicoespeon/abracadabra/compare/6.18.0...6.18.1
[6.18.0]: https://github.com/nicoespeon/abracadabra/compare/6.17.0...6.18.0
[6.17.0]: https://github.com/nicoespeon/abracadabra/compare/6.16.0...6.17.0
[6.16.0]: https://github.com/nicoespeon/abracadabra/compare/6.15.3...6.16.0
[6.15.3]: https://github.com/nicoespeon/abracadabra/compare/6.15.2...6.15.3
[6.15.2]: https://github.com/nicoespeon/abracadabra/compare/6.15.1...6.15.2
[6.15.1]: https://github.com/nicoespeon/abracadabra/compare/6.15.0...6.15.1
[6.15.0]: https://github.com/nicoespeon/abracadabra/compare/6.14.4...6.15.0
[6.14.4]: https://github.com/nicoespeon/abracadabra/compare/6.14.3...6.14.4
[6.14.3]: https://github.com/nicoespeon/abracadabra/compare/6.14.2...6.14.3
[6.14.2]: https://github.com/nicoespeon/abracadabra/compare/6.14.1...6.14.2
[6.14.1]: https://github.com/nicoespeon/abracadabra/compare/6.14.0...6.14.1
[6.14.0]: https://github.com/nicoespeon/abracadabra/compare/6.13.0...6.14.0
[6.13.0]: https://github.com/nicoespeon/abracadabra/compare/6.12.0...6.13.0
[6.12.0]: https://github.com/nicoespeon/abracadabra/compare/6.11.0...6.12.0
[6.11.0]: https://github.com/nicoespeon/abracadabra/compare/6.10.0...6.11.0
[6.10.0]: https://github.com/nicoespeon/abracadabra/compare/6.9.1...6.10.0
[6.9.1]: https://github.com/nicoespeon/abracadabra/compare/6.9.0...6.9.1
[6.9.0]: https://github.com/nicoespeon/abracadabra/compare/6.8.0...6.9.0
[6.8.0]: https://github.com/nicoespeon/abracadabra/compare/6.7.1...6.8.0
[6.7.1]: https://github.com/nicoespeon/abracadabra/compare/6.7.0...6.7.1
[6.7.0]: https://github.com/nicoespeon/abracadabra/compare/6.6.0...6.7.0
[6.6.0]: https://github.com/nicoespeon/abracadabra/compare/6.5.2...6.6.0
[6.5.2]: https://github.com/nicoespeon/abracadabra/compare/6.5.1...6.5.2
[6.5.1]: https://github.com/nicoespeon/abracadabra/compare/6.5.0...6.5.1
[6.5.0]: https://github.com/nicoespeon/abracadabra/compare/6.4.0...6.5.0
[6.4.0]: https://github.com/nicoespeon/abracadabra/compare/6.3.1...6.4.0
[6.3.1]: https://github.com/nicoespeon/abracadabra/compare/6.3.0...6.3.1
[6.3.0]: https://github.com/nicoespeon/abracadabra/compare/6.2.0...6.3.0
[6.2.0]: https://github.com/nicoespeon/abracadabra/compare/6.1.1...6.2.0
[6.1.1]: https://github.com/nicoespeon/abracadabra/compare/6.1.0...6.1.1
[6.1.0]: https://github.com/nicoespeon/abracadabra/compare/6.0.0...6.1.0
[6.0.0]: https://github.com/nicoespeon/abracadabra/compare/5.4.2...6.0.0
[5.4.2]: https://github.com/nicoespeon/abracadabra/compare/5.4.1...5.4.2
[5.4.1]: https://github.com/nicoespeon/abracadabra/compare/5.4.0...5.4.1
[5.4.0]: https://github.com/nicoespeon/abracadabra/compare/5.3.1...5.4.0
[5.3.1]: https://github.com/nicoespeon/abracadabra/compare/5.3.0...5.3.1
[5.3.0]: https://github.com/nicoespeon/abracadabra/compare/5.2.0...5.3.0
[5.2.0]: https://github.com/nicoespeon/abracadabra/compare/5.1.0...5.2.0
[5.1.0]: https://github.com/nicoespeon/abracadabra/compare/5.0.1...5.1.0
[5.0.1]: https://github.com/nicoespeon/abracadabra/compare/5.0.0...5.0.1
[5.0.0]: https://github.com/nicoespeon/abracadabra/compare/4.13.1...5.0.0
[4.13.1]: https://github.com/nicoespeon/abracadabra/compare/4.13.0...4.13.1
[4.13.0]: https://github.com/nicoespeon/abracadabra/compare/4.12.1...4.13.0
[4.12.1]: https://github.com/nicoespeon/abracadabra/compare/4.12.0...4.12.1
[4.12.0]: https://github.com/nicoespeon/abracadabra/compare/4.11.0...4.12.0
[4.11.0]: https://github.com/nicoespeon/abracadabra/compare/4.10.0...4.11.0
[4.10.0]: https://github.com/nicoespeon/abracadabra/compare/4.9.3...4.10.0
[4.9.3]: https://github.com/nicoespeon/abracadabra/compare/4.9.2...4.9.3
[4.9.2]: https://github.com/nicoespeon/abracadabra/compare/4.9.1...4.9.2
[4.9.1]: https://github.com/nicoespeon/abracadabra/compare/4.9.0...4.9.1
[4.9.0]: https://github.com/nicoespeon/abracadabra/compare/4.8.0...4.9.0
[4.8.0]: https://github.com/nicoespeon/abracadabra/compare/4.7.0...4.8.0
[4.7.0]: https://github.com/nicoespeon/abracadabra/compare/4.6.0...4.7.0
[4.6.0]: https://github.com/nicoespeon/abracadabra/compare/4.5.0...4.6.0
[4.5.0]: https://github.com/nicoespeon/abracadabra/compare/4.4.0...4.5.0
[4.4.0]: https://github.com/nicoespeon/abracadabra/compare/4.3.0...4.4.0
[4.3.0]: https://github.com/nicoespeon/abracadabra/compare/4.2.0...4.3.0
[4.2.0]: https://github.com/nicoespeon/abracadabra/compare/4.1.0...4.2.0
[4.1.0]: https://github.com/nicoespeon/abracadabra/compare/4.0.1...4.1.0
[4.0.1]: https://github.com/nicoespeon/abracadabra/compare/4.0.0...4.0.1
[4.0.0]: https://github.com/nicoespeon/abracadabra/compare/3.2.3...4.0.0
[3.2.3]: https://github.com/nicoespeon/abracadabra/compare/3.2.2...3.2.3
[3.2.2]: https://github.com/nicoespeon/abracadabra/compare/3.2.1...3.2.2
[3.2.1]: https://github.com/nicoespeon/abracadabra/compare/3.2.0...3.2.1
[3.2.0]: https://github.com/nicoespeon/abracadabra/compare/3.1.0...3.2.0
[3.1.0]: https://github.com/nicoespeon/abracadabra/compare/3.0.0...3.1.0
[3.0.0]: https://github.com/nicoespeon/abracadabra/compare/2.0.0...3.0.0
[2.0.0]: https://github.com/nicoespeon/abracadabra/compare/1.2.1...2.0.0
[1.2.1]: https://github.com/nicoespeon/abracadabra/compare/1.2.0...1.2.1
[1.2.0]: https://github.com/nicoespeon/abracadabra/compare/1.1.0...1.2.0
[1.1.0]: https://github.com/nicoespeon/abracadabra/compare/1.0.1...1.1.0
[1.0.1]: https://github.com/nicoespeon/abracadabra/compare/1.0.0...1.0.1
[1.0.0]: https://github.com/nicoespeon/abracadabra/compare/0.11.0...1.0.0
[0.11.0]: https://github.com/nicoespeon/abracadabra/compare/0.10.0...0.11.0
[0.10.0]: https://github.com/nicoespeon/abracadabra/compare/0.9.0...0.10.0
[0.9.0]: https://github.com/nicoespeon/abracadabra/compare/0.8.0...0.9.0
[0.8.0]: https://github.com/nicoespeon/abracadabra/compare/0.7.0...0.8.0
[0.7.0]: https://github.com/nicoespeon/abracadabra/compare/0.6.0...0.7.0
[0.6.0]: https://github.com/nicoespeon/abracadabra/compare/0.5.0...0.6.0
[0.5.0]: https://github.com/nicoespeon/abracadabra/compare/0.4.0...0.5.0
[0.4.0]: https://github.com/nicoespeon/abracadabra/compare/0.3.0...0.4.0
[0.3.0]: https://github.com/nicoespeon/abracadabra/compare/0.2.0...0.3.0
[0.2.0]: https://github.com/nicoespeon/abracadabra/compare/0.1.0...0.2.0
[0.1.0]: https://github.com/nicoespeon/abracadabra/compare/0.0.1...0.1.0
[0.0.1]: https://github.com/nicoespeon/abracadabra/compare/224558fafc2c9247b637a74a7f17fe3c62140d47...0.0.1

<!-- Demo images -->

[demo-toggle-highlights]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/toggle-highlights.gif?raw=true
[demo-extract-substring]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/extract-substring.gif?raw=true
[demo-extract-variable-multiple-occurrences]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/extract-variable-multiple-occurrences.gif?raw=true
[demo-merge-if-statements-else-if]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/merge-if-statements-else-if.gif?raw=true
[demo-extract-generic-type]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/extract-generic-type.gif?raw=true
[demo-convert-switch-to-if-else]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/convert-switch-to-if-else.gif?raw=true
[demo-destructure-object]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/destructure-object.gif?raw=true

<!-- Links -->

[guard-clause]: https://deviq.com/guard-clause/
[adr-0008]: https://github.com/nicoespeon/abracadabra/blob/main/docs/adr/0008-don-t-propose-quick-fix-for-react-convert-to-pure-component.md
[adr-0013]: https://github.com/nicoespeon/abracadabra/blob/main/docs/adr/0013-remove-extract-class-and-convert-to-pure-component-refactorings.md
