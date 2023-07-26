# 🧙‍ Abracadabra

> **Refactoring** (noun): a change made to the internal structure of software to make it easier to understand and cheaper to modify without changing its observable behavior.
>
> — _"Refactoring: Improving the Design of Existing Code" by Martin Fowler_

![][logo-abracadabra]

<!-- prettier-ignore-start -->
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-58-orange.svg?style=flat-square)](#contributors)
<!-- ALL-CONTRIBUTORS-BADGE:END -->
<!-- prettier-ignore-end -->

[![Build Status](https://travis-ci.com/nicoespeon/abracadabra.svg?branch=main)](https://travis-ci.com/nicoespeon/abracadabra)
![](https://img.shields.io/badge/it%27s-magic-purple.svg)

With Abracadabra, **you can quickly and safely refactor existing code in VS Code**.

VS Code ships with [a few basic refactorings][vscode-refactorings]. Abracadabra supercharges your editor with:

- 🎁 Much, much more refactorings
- ⚡ Shortcuts to trigger the most useful ones in no-time
- 💡 Quick Fixes to suggest refactorings when appropriate
- 🛠 Options to customize the UX to your needs
- 💬 Refactorings that work with `.js`, `.jsx`, `.ts`, `.tsx`, `.vue` and `.svelte` files

Refactor Legacy Code in a snap! 👌

![Abracadabra in action][demo-abracadabra]

## Installation

1. Click on the Extensions icon (usually on the left-hand side of your editor).
1. Search for "Abracadabra".
1. Find the extension in the list and click the install button.

## List of available refactorings

We have 40+ automated refactorings such as Extract Variable, Extract Type, Flip If/Else, Move to Existing File, etc.

**👉 [Here's the full catalog of refactorings available][all-refactorings]**

All refactorings are available through the [Command Palette][command-palette].

![][demo-command-palette]

Some refactorings have default keybindings configured, but [you can change that][change-keybindings].

All other refactorings are available through [VS Code Quick Fixes][vscode-quick-fixes]. You can access them by clicking on the lightbulb that appear next to the code 💡 or use the default shortcut `Alt ↵`.

Pro Tip: You can also disable the Quick Fixes you never use in [VS Code settings][vscode-settings] 🔥 (look for _Abracadabra_)

## Features that support refactorings

Besides refactorings, Abracadabra also gives you some extra features that are here to support refactoring work.

### Highlight Identifiers

![][demo-toggle-highlights]

When working with Legacy Code, a very useful refactoring consists in extracting pure logic out of the I/O code that is hard to test (eg. HTTP calls).

To help you spot all the I/O bits in a chunk of code, Abracadabra can highlight them for you!

| Feature               | Keybinding               | On Mac  |
| :-------------------- | :----------------------- | :------ |
| Toggle Highlight      | `Ctrl + Alt + H`         | `⌃ H`   |
| Refresh Highlights    | `Shift + Alt + H`        | `⌃ ⌥ H` |
| Remove All Highlights | `Ctrl + Shift + Alt + H` | `⇧ ⌃ H` |

1. Put your cursor over an Identifier you want to highlight
2. Press `Ctrl + Alt + H`

All references to this Identifier will be highlighted. The highlight will persist even when you modify the code.

To remove, either:

- Put your cursor over a highlighted reference and press `Ctrl + Alt + H` again
- Press `Ctrl + Shift + Alt + H` from anywhere, to remove all highlights

This is handy for marking I/O code when refactoring, but you can use it to highlight any interesting Identifier and its references. Here are a few typical use cases:

- Mark all usages of a variable, to help you regroup them
- Identify variables that are always passed together in function calls

#### Does it highlights new references automatically?

Say you have highlighted a variable. Now you add some more code that refers to the same variable.

It won't be _automatically_ highlighted.

We could. But a naive implementation of this would constantly parse the AST of the code you are working with, which would probably affect your editor performances (not good).

One way to do it would be to toggle highlight over the reference once to remove the old highlight, then again to get the new reference! But that's annoying!

That's why you have a "Refresh Highlights" command. Hit `Shift + Alt + H` and references will be recomputed again for you!

## Configuration

| Setting                       | Description                                       | Default                 |
| ----------------------------- | ------------------------------------------------- | ----------------------- |
| `abracadabra.ignoredFolders`  | Folders where it won't propose refactorings       | `["node_modules"]`      |
| `abracadabra.ignoredPatterns` | Glob patterns where it won't propose refactorings | `["dist/*", "build/*"]` |

For the glob patterns, read [glob's documentation](https://github.com/isaacs/node-glob/blob/f5a57d3d6e19b324522a3fa5bdd5075fd1aa79d1/README.md#glob-primer) to see what you can filter out.

All refactorings that appear in Quick Fix suggestions can also be disabled in [your VS Code settings][vscode-settings] 🔥 (look for _Abracadabra_)

## Release Notes

[Have a look at our CHANGELOG][changelog] to get the details of all changes between versions.

### Versioning

We follow [SemVer][semver] convention for versioning.

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

## Contributors

Thanks goes to these wonderful people ([emoji key][all-contributors-emoji]):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://nicoespeon.com/"><img src="https://avatars0.githubusercontent.com/u/1094774?v=4?s=100" width="100px;" alt="Nicolas Carlo"/><br /><sub><b>Nicolas Carlo</b></sub></a><br /><a href="#ideas-nicoespeon" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=nicoespeon" title="Code">💻</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=nicoespeon" title="Documentation">📖</a> <a href="https://github.com/nicoespeon/abracadabra/pulls?q=is%3Apr+reviewed-by%3Anicoespeon" title="Reviewed Pull Requests">👀</a> <a href="#question-nicoespeon" title="Answering Questions">💬</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://fabien0102.com/"><img src="https://avatars1.githubusercontent.com/u/1761469?v=4?s=100" width="100px;" alt="Fabien BERNARD"/><br /><sub><b>Fabien BERNARD</b></sub></a><br /><a href="#ideas-fabien0102" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=fabien0102" title="Code">💻</a> <a href="#design-fabien0102" title="Design">🎨</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.elsewebdevelopment.com/"><img src="https://avatars2.githubusercontent.com/u/12832280?v=4?s=100" width="100px;" alt="David"/><br /><sub><b>David</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3ADavid-Else" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/HEYGUL"><img src="https://avatars2.githubusercontent.com/u/2989532?v=4?s=100" width="100px;" alt="GUL"/><br /><sub><b>GUL</b></sub></a><br /><a href="#ideas-HEYGUL" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=HEYGUL" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/visusnet"><img src="https://avatars1.githubusercontent.com/u/1219124?v=4?s=100" width="100px;" alt="Alexander Rose"/><br /><sub><b>Alexander Rose</b></sub></a><br /><a href="#ideas-visusnet" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=visusnet" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/timvancleef"><img src="https://avatars1.githubusercontent.com/u/7040078?v=4?s=100" width="100px;" alt="Tim van Cleef"/><br /><sub><b>Tim van Cleef</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/commits?author=timvancleef" title="Code">💻</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=timvancleef" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/automatensalat"><img src="https://avatars1.githubusercontent.com/u/26285169?v=4?s=100" width="100px;" alt="Tobias Hann"/><br /><sub><b>Tobias Hann</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Aautomatensalat" title="Bug reports">🐛</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=automatensalat" title="Code">💻</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=automatensalat" title="Documentation">📖</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://twitter.com/capajj"><img src="https://avatars0.githubusercontent.com/u/1305378?v=4?s=100" width="100px;" alt="Jiri Spac"/><br /><sub><b>Jiri Spac</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Acapaj" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://www.lyreal666.com/"><img src="https://avatars2.githubusercontent.com/u/41773861?v=4?s=100" width="100px;" alt="YuTengjing"/><br /><sub><b>YuTengjing</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Atjx666" title="Bug reports">🐛</a> <a href="#infra-tjx666" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=tjx666" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/delaaxe"><img src="https://avatars1.githubusercontent.com/u/1091900?v=4?s=100" width="100px;" alt="delaaxe"/><br /><sub><b>delaaxe</b></sub></a><br /><a href="#ideas-delaaxe" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=delaaxe" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/jrnail23"><img src="https://avatars1.githubusercontent.com/u/392612?v=4?s=100" width="100px;" alt="James Nail"/><br /><sub><b>James Nail</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Ajrnail23" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://nickebbitt.github.io/"><img src="https://avatars3.githubusercontent.com/u/5111725?v=4?s=100" width="100px;" alt="Nick Ebbitt"/><br /><sub><b>Nick Ebbitt</b></sub></a><br /><a href="#ideas-nickebbitt" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=nickebbitt" title="Code">💻</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=nickebbitt" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://oliverjash.me/"><img src="https://avatars2.githubusercontent.com/u/921609?v=4?s=100" width="100px;" alt="Oliver Joseph Ash"/><br /><sub><b>Oliver Joseph Ash</b></sub></a><br /><a href="#ideas-OliverJAsh" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3AOliverJAsh" title="Bug reports">🐛</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=OliverJAsh" title="Code">💻</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=OliverJAsh" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://www.linkedin.com/in/albertoxamin"><img src="https://avatars3.githubusercontent.com/u/6067659?v=4?s=100" width="100px;" alt="Alberto Xamin"/><br /><sub><b>Alberto Xamin</b></sub></a><br /><a href="#ideas-albertoxamin" title="Ideas, Planning, & Feedback">🤔</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/sluukkonen"><img src="https://avatars1.githubusercontent.com/u/39655?v=4?s=100" width="100px;" alt="Sakumatti Luukkonen"/><br /><sub><b>Sakumatti Luukkonen</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Asluukkonen" title="Bug reports">🐛</a> <a href="#ideas-sluukkonen" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/justerest"><img src="https://avatars3.githubusercontent.com/u/24754883?v=4?s=100" width="100px;" alt="Sergey Klevakin"/><br /><sub><b>Sergey Klevakin</b></sub></a><br /><a href="#ideas-justerest" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=justerest" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ajanian"><img src="https://avatars1.githubusercontent.com/u/99716?v=4?s=100" width="100px;" alt="Andrew Janian"/><br /><sub><b>Andrew Janian</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Aajanian" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/leosdad"><img src="https://avatars1.githubusercontent.com/u/7026091?v=4?s=100" width="100px;" alt="leosdad"/><br /><sub><b>leosdad</b></sub></a><br /><a href="#ideas-leosdad" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Aleosdad" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/iulspop"><img src="https://avatars.githubusercontent.com/u/53665722?v=4?s=100" width="100px;" alt="Iuliu Pop"/><br /><sub><b>Iuliu Pop</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/commits?author=iulspop" title="Documentation">📖</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=iulspop" title="Code">💻</a> <a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Aiulspop" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/chrstnbrn"><img src="https://avatars.githubusercontent.com/u/11138584?v=4?s=100" width="100px;" alt="Christina Braun"/><br /><sub><b>Christina Braun</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/commits?author=chrstnbrn" title="Code">💻</a> <a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Achrstnbrn" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://zakmiller.com"><img src="https://avatars.githubusercontent.com/u/18072671?v=4?s=100" width="100px;" alt="Zak Miller"/><br /><sub><b>Zak Miller</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3AZakMiller" title="Bug reports">🐛</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=ZakMiller" title="Code">💻</a> <a href="#ideas-ZakMiller" title="Ideas, Planning, & Feedback">🤔</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/chipbite"><img src="https://avatars.githubusercontent.com/u/559199?v=4?s=100" width="100px;" alt="Marcus"/><br /><sub><b>Marcus</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Achipbite" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://jonboiser.com"><img src="https://avatars.githubusercontent.com/u/10248067?v=4?s=100" width="100px;" alt="Jonathan Boiser"/><br /><sub><b>Jonathan Boiser</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Ajonboiser" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://gurdiga.com"><img src="https://avatars.githubusercontent.com/u/53922?v=4?s=100" width="100px;" alt="Vlad GURDIGA"/><br /><sub><b>Vlad GURDIGA</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Agurdiga" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/SamHasler"><img src="https://avatars.githubusercontent.com/u/54277?v=4?s=100" width="100px;" alt="Sam Hasler"/><br /><sub><b>Sam Hasler</b></sub></a><br /><a href="#ideas-SamHasler" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://re.kv.io/"><img src="https://avatars.githubusercontent.com/u/7276?v=4?s=100" width="100px;" alt="Nicolas Favre-Felix"/><br /><sub><b>Nicolas Favre-Felix</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Anicolasff" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/wmertens"><img src="https://avatars.githubusercontent.com/u/54934?v=4?s=100" width="100px;" alt="Wout Mertens"/><br /><sub><b>Wout Mertens</b></sub></a><br /><a href="#ideas-wmertens" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://lukemiles.org"><img src="https://avatars.githubusercontent.com/u/10591373?v=4?s=100" width="100px;" alt="Luke Harold Miles"/><br /><sub><b>Luke Harold Miles</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Aqpwo" title="Bug reports">🐛</a> <a href="#ideas-qpwo" title="Ideas, Planning, & Feedback">🤔</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://bandism.net/"><img src="https://avatars.githubusercontent.com/u/22633385?v=4?s=100" width="100px;" alt="Ikko Ashimine"/><br /><sub><b>Ikko Ashimine</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/commits?author=eltociear" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/vfonic"><img src="https://avatars.githubusercontent.com/u/67437?v=4?s=100" width="100px;" alt="Viktor"/><br /><sub><b>Viktor</b></sub></a><br /><a href="#ideas-vfonic" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/sumbatx15"><img src="https://avatars.githubusercontent.com/u/28981577?v=4?s=100" width="100px;" alt="sumbatx15"/><br /><sub><b>sumbatx15</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Asumbatx15" title="Bug reports">🐛</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=sumbatx15" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/j4k0xb"><img src="https://avatars.githubusercontent.com/u/55899582?v=4?s=100" width="100px;" alt="j4k0xb"/><br /><sub><b>j4k0xb</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Aj4k0xb" title="Bug reports">🐛</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=j4k0xb" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://ianobermiller.com"><img src="https://avatars.githubusercontent.com/u/897931?v=4?s=100" width="100px;" alt="Ian Obermiller"/><br /><sub><b>Ian Obermiller</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/commits?author=ianobermiller" title="Code">💻</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=ianobermiller" title="Documentation">📖</a> <a href="#ideas-ianobermiller" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://forivall.com"><img src="https://avatars.githubusercontent.com/u/760204?v=4?s=100" width="100px;" alt="Emily Marigold Klassen"/><br /><sub><b>Emily Marigold Klassen</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/commits?author=forivall" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://zardoy.com"><img src="https://avatars.githubusercontent.com/u/46503702?v=4?s=100" width="100px;" alt="Vitaly"/><br /><sub><b>Vitaly</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/commits?author=zardoy" title="Code">💻</a> <a href="#infra-zardoy" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#ideas-zardoy" title="Ideas, Planning, & Feedback">🤔</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://stalefri.es"><img src="https://avatars.githubusercontent.com/u/383725?v=4?s=100" width="100px;" alt="Alan Hussey"/><br /><sub><b>Alan Hussey</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Aalanhussey" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/kevintechie"><img src="https://avatars.githubusercontent.com/u/10410717?v=4?s=100" width="100px;" alt="Kevin Coleman"/><br /><sub><b>Kevin Coleman</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Akevintechie" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/rsxdalv"><img src="https://avatars.githubusercontent.com/u/6757283?v=4?s=100" width="100px;" alt="Roberts Slisans"/><br /><sub><b>Roberts Slisans</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Arsxdalv" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/joshjm"><img src="https://avatars.githubusercontent.com/u/21700579?v=4?s=100" width="100px;" alt="Josh"/><br /><sub><b>Josh</b></sub></a><br /><a href="#ideas-joshjm" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/brunnerh"><img src="https://avatars.githubusercontent.com/u/834235?v=4?s=100" width="100px;" alt="brunnerh"/><br /><sub><b>brunnerh</b></sub></a><br /><a href="#ideas-brunnerh" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://twitter.com/11joselu"><img src="https://avatars.githubusercontent.com/u/8685132?v=4?s=100" width="100px;" alt="Jose Cabrera"/><br /><sub><b>Jose Cabrera</b></sub></a><br /><a href="#ideas-11joselu" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=11joselu" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://app.element.io/#/user/@BuZZ-dEE:matrix.org"><img src="https://avatars.githubusercontent.com/u/125954?v=4?s=100" width="100px;" alt="Sebastian Schlatow"/><br /><sub><b>Sebastian Schlatow</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3ABuZZ-dEE" title="Bug reports">🐛</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/jtwigg"><img src="https://avatars.githubusercontent.com/u/1237233?v=4?s=100" width="100px;" alt="jtwigg"/><br /><sub><b>jtwigg</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Ajtwigg" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://www.andypatterns.com"><img src="https://avatars.githubusercontent.com/u/11467530?v=4?s=100" width="100px;" alt="Andy Bulka"/><br /><sub><b>Andy Bulka</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Aabulka" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://www.andrewash.com"><img src="https://avatars.githubusercontent.com/u/357170?v=4?s=100" width="100px;" alt="Andrew Ash"/><br /><sub><b>Andrew Ash</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/commits?author=ash211" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/azhiv"><img src="https://avatars.githubusercontent.com/u/32125472?v=4?s=100" width="100px;" alt="Artem Zhivoderov"/><br /><sub><b>Artem Zhivoderov</b></sub></a><br /><a href="#ideas-azhiv" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=azhiv" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/srsholmes"><img src="https://avatars.githubusercontent.com/u/3579905?v=4?s=100" width="100px;" alt="Simon Holmes"/><br /><sub><b>Simon Holmes</b></sub></a><br /><a href="#ideas-srsholmes" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=srsholmes" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ramunsk"><img src="https://avatars.githubusercontent.com/u/514899?v=4?s=100" width="100px;" alt="Ramunas"/><br /><sub><b>Ramunas</b></sub></a><br /><a href="#ideas-ramunsk" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/yume-chan"><img src="https://avatars.githubusercontent.com/u/1330321?v=4?s=100" width="100px;" alt="Simon Chan"/><br /><sub><b>Simon Chan</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Ayume-chan" title="Bug reports">🐛</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="http://byroni.us"><img src="https://avatars.githubusercontent.com/u/495404?v=4?s=100" width="100px;" alt="byron wall"/><br /><sub><b>byron wall</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Abyronwall" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/jerone"><img src="https://avatars.githubusercontent.com/u/55841?v=4?s=100" width="100px;" alt="Jeroen van Warmerdam"/><br /><sub><b>Jeroen van Warmerdam</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/commits?author=jerone" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://blog.hand-net.com"><img src="https://avatars.githubusercontent.com/u/184604?v=4?s=100" width="100px;" alt="Steve Beaugé"/><br /><sub><b>Steve Beaugé</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Astevebeauge" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/SamB"><img src="https://avatars.githubusercontent.com/u/13903?v=4?s=100" width="100px;" alt="Samuel Bronson"/><br /><sub><b>Samuel Bronson</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3ASamB" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.linkedin.com/in/timonjurschitsch/"><img src="https://avatars.githubusercontent.com/u/103483059?v=4?s=100" width="100px;" alt="Timon Jurschitsch"/><br /><sub><b>Timon Jurschitsch</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/commits?author=DerTimonius" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://dribbble.com/leodriesch"><img src="https://avatars.githubusercontent.com/u/39763575?v=4?s=100" width="100px;" alt="Leo Driesch"/><br /><sub><b>Leo Driesch</b></sub></a><br /><a href="#ideas-leodr" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://about.me/romainguerin"><img src="https://avatars.githubusercontent.com/u/285534?v=4?s=100" width="100px;" alt="Romain Guerin"/><br /><sub><b>Romain Guerin</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Apomeh" title="Bug reports">🐛</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/victor-homyakov"><img src="https://avatars.githubusercontent.com/u/121449?v=4?s=100" width="100px;" alt="Victor Homyakov"/><br /><sub><b>Victor Homyakov</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Avictor-homyakov" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/xixixao"><img src="https://avatars.githubusercontent.com/u/1473433?v=4?s=100" width="100px;" alt="Michal Srb"/><br /><sub><b>Michal Srb</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Axixixao" title="Bug reports">🐛</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors][all-contributors] specification.

Contributions of any kind are welcome!

## Alternatives

Building automated refactoring for JavaScript is not easy, and it takes time. Since this is a side-project, it doesn't get as much time as it should to cover everything you need.

If Abracadabra doesn't fit your need for something, here are the other extensions I recommend you check:

- [JS CodeFormer](https://marketplace.visualstudio.com/items?itemName=cmstead.js-codeformer) which is built by [Chris Stead](https://twitter.com/cm_stead). Chris built the first JS refactorings extension in VS Code back in the days, so he knows his stuff 👍
- [P42 JavaScript assistant](https://marketplace.visualstudio.com/items?itemName=p42ai.refactor) is a recent and impressive tool built by [Lars Grammel](https://twitter.com/lgrammel). I had the opportunity to chat with Lars and we really think alike. The main difference is that Lars is dedicated full-time into building this. It's not open-source, but it may solve the problem you have 😉
- [JavaScript Booster](https://marketplace.visualstudio.com/items?itemName=sburg.vscode-javascript-booster) is a popular extension that mimics Webstorm's UX for refactoring—which was a source of inspiration for Abracadabra. Worth having a look.

There are some things I think Abracadabra does better. Other things Abracadabra does worse. The goal with this extension is to provide automated refactorings that are easy to use and VS Code misses. If others are implementing them, I'm more than happy to recommend (and use) their tool!

Have a look, give them a try, use a combination of tools that work best for you.

---

![](https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/magic.gif?raw=true)

## License

💁 [MIT][license]

<!-- Links -->

[hocus-pocus]: https://marketplace.visualstudio.com/items?itemName=nicoespeon.hocus-pocus
[command-palette]: https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette
[change-keybindings]: https://code.visualstudio.com/docs/getstarted/keybindings
[vscode-refactorings]: https://code.visualstudio.com/docs/editor/refactoring
[vscode-quick-fixes]: https://code.visualstudio.com/docs/editor/refactoring#_code-actions-quick-fixes-and-refactorings
[vscode-settings]: https://code.visualstudio.com/docs/getstarted/settings
[js-refactor]: https://marketplace.visualstudio.com/items?itemName=cmstead.jsrefactor
[js-booster]: https://marketplace.visualstudio.com/items?itemName=sburg.vscode-javascript-booster
[changelog]: https://github.com/nicoespeon/abracadabra/blob/main/CHANGELOG.md
[all-refactorings]: https://github.com/nicoespeon/abracadabra/blob/main/REFACTORINGS.md
[contributing]: https://github.com/nicoespeon/abracadabra/blob/main/CONTRIBUTING.md
[license]: https://github.com/nicoespeon/abracadabra/blob/main/LICENSE.md
[good-first-issues]: https://github.com/nicoespeon/abracadabra/issues?q=is%3Aissue+is%3Aopen+label%3A%22%3Awave%3A+Good+first+issue%22
[semver]: http://semver.org/
[all-contributors]: https://allcontributors.org
[all-contributors-emoji]: https://allcontributors.org/docs/en/emoji-key

<!-- Demo images -->

[demo-toggle-highlights]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/toggle-highlights.gif?raw=true
[demo-command-palette]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/command-palette.png?raw=true
[demo-abracadabra]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/extract-variable-multiple-occurrences.gif?raw=true

<!-- Logo -->

[logo-abracadabra]: https://github.com/nicoespeon/abracadabra/blob/main/docs/logo/abracadabra-logo.png?raw=true
