# 🧙‍ Abracadabra

> **Refactoring** (noun): a change made to the internal structure of software to make it easier to understand and cheaper to modify without changing its observable behavior.
>
> — _"Refactoring: Improving the Design of Existing Code" by Martin Fowler_

![][logo-abracadabra]

<!-- prettier-ignore-start -->
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-32-orange.svg?style=flat-square)](#contributors)
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
- 💬 Refactorings that work with `.js`, `.jsx`, `.ts`, `.tsx` and `.vue` files

Refactor Legacy Code in a snap! 👌

![Abracadabra in action][demo-abracadabra]

## Installation

1. Click on the Extensions icon (usually on the left-hand side of your editor).
1. Search for "Abracadabra".
1. Find the extension in the list and click the install button.

## List of available refactorings

We have 35+ automated refactorings such as Extract Variable, Extract Type, Flip If/Else, Move to Existing File, etc.

**👉 [Here's the full catalog of refactorings available][all-refactorings]**

All refactorings are available through the [Command Palette][command-palette].

![][demo-command-palette]

Some refactorings have default keybindings configured, but [you can change that][change-keybindings].

All other refactorings are available through [VS Code Quick Fixes][vscode-quick-fixes]. You can access them by clicking on the lightbulb that appear next to the code 💡 or use the default shortcut `Alt ↵`.

Pro Tip: You can also disable the Quick Fixes you never use in [VS Code settings][vscode-settings] 🔥 (look for _Abracadabra_)

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

## Contributors

Thanks goes to these wonderful people ([emoji key][all-contributors-emoji]):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://nicoespeon.com/"><img src="https://avatars0.githubusercontent.com/u/1094774?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Nicolas Carlo</b></sub></a><br /><a href="#ideas-nicoespeon" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=nicoespeon" title="Code">💻</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=nicoespeon" title="Documentation">📖</a> <a href="https://github.com/nicoespeon/abracadabra/pulls?q=is%3Apr+reviewed-by%3Anicoespeon" title="Reviewed Pull Requests">👀</a> <a href="#question-nicoespeon" title="Answering Questions">💬</a></td>
    <td align="center"><a href="https://fabien0102.com/"><img src="https://avatars1.githubusercontent.com/u/1761469?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Fabien BERNARD</b></sub></a><br /><a href="#ideas-fabien0102" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=fabien0102" title="Code">💻</a> <a href="#design-fabien0102" title="Design">🎨</a></td>
    <td align="center"><a href="https://www.elsewebdevelopment.com/"><img src="https://avatars2.githubusercontent.com/u/12832280?v=4?s=100" width="100px;" alt=""/><br /><sub><b>David</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3ADavid-Else" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/HEYGUL"><img src="https://avatars2.githubusercontent.com/u/2989532?v=4?s=100" width="100px;" alt=""/><br /><sub><b>GUL</b></sub></a><br /><a href="#ideas-HEYGUL" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=HEYGUL" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/visusnet"><img src="https://avatars1.githubusercontent.com/u/1219124?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Alexander Rose</b></sub></a><br /><a href="#ideas-visusnet" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=visusnet" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/timvancleef"><img src="https://avatars1.githubusercontent.com/u/7040078?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Tim van Cleef</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/commits?author=timvancleef" title="Code">💻</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=timvancleef" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/automatensalat"><img src="https://avatars1.githubusercontent.com/u/26285169?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Tobias Hann</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Aautomatensalat" title="Bug reports">🐛</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=automatensalat" title="Code">💻</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=automatensalat" title="Documentation">📖</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://twitter.com/capajj"><img src="https://avatars0.githubusercontent.com/u/1305378?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Jiri Spac</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Acapaj" title="Bug reports">🐛</a></td>
    <td align="center"><a href="http://www.lyreal666.com/"><img src="https://avatars2.githubusercontent.com/u/41773861?v=4?s=100" width="100px;" alt=""/><br /><sub><b>YuTengjing</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Atjx666" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/delaaxe"><img src="https://avatars1.githubusercontent.com/u/1091900?v=4?s=100" width="100px;" alt=""/><br /><sub><b>delaaxe</b></sub></a><br /><a href="#ideas-delaaxe" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=delaaxe" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/jrnail23"><img src="https://avatars1.githubusercontent.com/u/392612?v=4?s=100" width="100px;" alt=""/><br /><sub><b>James Nail</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Ajrnail23" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://nickebbitt.github.io/"><img src="https://avatars3.githubusercontent.com/u/5111725?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Nick Ebbitt</b></sub></a><br /><a href="#ideas-nickebbitt" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=nickebbitt" title="Code">💻</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=nickebbitt" title="Documentation">📖</a></td>
    <td align="center"><a href="https://oliverjash.me/"><img src="https://avatars2.githubusercontent.com/u/921609?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Oliver Joseph Ash</b></sub></a><br /><a href="#ideas-OliverJAsh" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3AOliverJAsh" title="Bug reports">🐛</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=OliverJAsh" title="Code">💻</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=OliverJAsh" title="Documentation">📖</a></td>
    <td align="center"><a href="http://www.linkedin.com/in/albertoxamin"><img src="https://avatars3.githubusercontent.com/u/6067659?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Alberto Xamin</b></sub></a><br /><a href="#ideas-albertoxamin" title="Ideas, Planning, & Feedback">🤔</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/sluukkonen"><img src="https://avatars1.githubusercontent.com/u/39655?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Sakumatti Luukkonen</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Asluukkonen" title="Bug reports">🐛</a> <a href="#ideas-sluukkonen" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://github.com/justerest"><img src="https://avatars3.githubusercontent.com/u/24754883?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Sergey Klevakin</b></sub></a><br /><a href="#ideas-justerest" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=justerest" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/ajanian"><img src="https://avatars1.githubusercontent.com/u/99716?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Andrew Janian</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Aajanian" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/leosdad"><img src="https://avatars1.githubusercontent.com/u/7026091?v=4?s=100" width="100px;" alt=""/><br /><sub><b>leosdad</b></sub></a><br /><a href="#ideas-leosdad" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Aleosdad" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/iulspop"><img src="https://avatars.githubusercontent.com/u/53665722?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Iuliu Pop</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/commits?author=iulspop" title="Documentation">📖</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=iulspop" title="Code">💻</a> <a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Aiulspop" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/chrstnbrn"><img src="https://avatars.githubusercontent.com/u/11138584?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Christina Braun</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/commits?author=chrstnbrn" title="Code">💻</a></td>
    <td align="center"><a href="https://zakmiller.com"><img src="https://avatars.githubusercontent.com/u/18072671?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Zak Miller</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3AZakMiller" title="Bug reports">🐛</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=ZakMiller" title="Code">💻</a> <a href="#ideas-ZakMiller" title="Ideas, Planning, & Feedback">🤔</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/chipbite"><img src="https://avatars.githubusercontent.com/u/559199?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Marcus</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Achipbite" title="Bug reports">🐛</a></td>
    <td align="center"><a href="http://jonboiser.com"><img src="https://avatars.githubusercontent.com/u/10248067?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Jonathan Boiser</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Ajonboiser" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://gurdiga.com"><img src="https://avatars.githubusercontent.com/u/53922?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Vlad GURDIGA</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Agurdiga" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/SamHasler"><img src="https://avatars.githubusercontent.com/u/54277?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Sam Hasler</b></sub></a><br /><a href="#ideas-SamHasler" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://re.kv.io/"><img src="https://avatars.githubusercontent.com/u/7276?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Nicolas Favre-Felix</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Anicolasff" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/wmertens"><img src="https://avatars.githubusercontent.com/u/54934?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Wout Mertens</b></sub></a><br /><a href="#ideas-wmertens" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://lukemiles.org"><img src="https://avatars.githubusercontent.com/u/10591373?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Luke Harold Miles</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Aqpwo" title="Bug reports">🐛</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://bandism.net/"><img src="https://avatars.githubusercontent.com/u/22633385?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Ikko Ashimine</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/commits?author=eltociear" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/vfonic"><img src="https://avatars.githubusercontent.com/u/67437?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Viktor</b></sub></a><br /><a href="#ideas-vfonic" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://github.com/sumbatx15"><img src="https://avatars.githubusercontent.com/u/28981577?v=4?s=100" width="100px;" alt=""/><br /><sub><b>sumbatx15</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Asumbatx15" title="Bug reports">🐛</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=sumbatx15" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/j4k0xb"><img src="https://avatars.githubusercontent.com/u/55899582?v=4?s=100" width="100px;" alt=""/><br /><sub><b>j4k0xb</b></sub></a><br /><a href="https://github.com/nicoespeon/abracadabra/issues?q=author%3Aj4k0xb" title="Bug reports">🐛</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors][all-contributors] specification.

Contributions of any kind are welcome!

## Other extensions you may like

- [Hocus Pocus][hocus-pocus], a VS Code extension that creates missing code for you, in JavaScript and TypeScript.

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

[demo-command-palette]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/command-palette.png?raw=true
[demo-abracadabra]: https://github.com/nicoespeon/abracadabra/blob/main/docs/demo/extract-variable-multiple-occurrences.gif?raw=true

<!-- Logo -->

[logo-abracadabra]: https://github.com/nicoespeon/abracadabra/blob/main/docs/logo/abracadabra-logo.png?raw=true
