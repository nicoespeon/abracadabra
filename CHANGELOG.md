# Changelog

All notable changes to the **Abracadabra** extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

## [1.2.1] - 2019-11-30

### Fixed

- Fix cursor position after Extract Variable that creates a shorthand on an object property that ends with a comma, so rename works
- Stop proposing Negate Expression quick fix on single call expressions, since the negated expression is identical
- Remove double-negations after running Negate Expression on a multi-line expression

## [1.2.0] - 2019-11-28 - Big head, shorthand 🦖

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

We've optimized the way we determine which refactorings can be executed **at your current cursor position**. This is an Abracabra key feature.

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
messages.map(message => ({ userId }));
```

If you tried to inline `userId`, it wouldn't work because destructured object patterns were not supported.

Now it would work as expected:

```js
messages.map(message => ({ userId: session.userId }));
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

[unreleased]: https://github.com/nicoespeon/abracadabra/compare/1.2.1...HEAD
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

[demo-extract-variable-multiple-occurrences]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/extract-variable-multiple-occurrences.gif?raw=true
[demo-merge-if-statements-else-if]: https://github.com/nicoespeon/abracadabra/blob/master/docs/demo/merge-if-statements-else-if.gif?raw=true

<!-- Links -->

[guard-clause]: https://deviq.com/guard-clause/
