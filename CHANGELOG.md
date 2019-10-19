# Changelog

All notable changes to the **Abracadabra** extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

## [0.9.0] - 2019-10-17

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

## [0.8.0] - 2019-09-22

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

## [0.7.0] - 2019-09-16

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

## [0.6.0] - 2019-09-08

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

## [0.5.0] - 2019-08-25

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

## [0.4.0] - 2019-08-18

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

## [0.3.0] - 2019-08-10

### Added

- **[New refactoring]** Convert to Template Literal
- **[New refactoring]** Split Declaration and Initialization

### Fixed

- Don't add unnecessary braces when extracting JSX elements.
- Don't extract arrow function expressions params.
- Remove Redundant Else now handles nested _If_ statements correctly.
- Flip Ternary now handles nested ternaries correctly.
- Flip If/Else now handles nested _If_ statements correctly.

## [0.2.0] - 2019-08-05

### Added

- **[New refactoring]** Inline Function
- **[New refactoring]** Merge If Statements

## [0.1.0] - 2019-07-23

### Fixed

- Inline Variable with object shorthand properties

### Added

- Move Statement Up/Down now work on object properties too
- **[New refactoring]** Split If Statement
- **[New refactoring]** Remove Braces from Arrow Function
- **[New refactoring]** Add Braces to Arrow Function

## [0.0.1] - 2019-07-09

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

[unreleased]: https://github.com/nicoespeon/abracadabra/compare/0.9.0...HEAD
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
