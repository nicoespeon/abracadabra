# 9. Use custom GitHub actions to deploy

Date: 2020-10-22

## Status

Accepted

## Context

We want to automate the process of deploying a bit more. At this point, crafting a new release is done manually by @nicoespeon.

Also, we want to start deploying to [the Open VSX Registry](https://open-vsx.org/) so Abracadabra would be available for VS Code alternatives as [VS Codium](https://vscodium.com/). You can read [the original issue](https://github.com/nicoespeon/abracadabra/issues/163) for more context.

Source code is hosted and managed in GitHub, so GitHub Actions make sense.

There is [a custom GitHub Action](https://github.com/HaaLeo/publish-vscode-extension#readme) that would take care of that precise use-case. But what we need to do isn't very complex. Having less intermediate would make it easier to maintain.

## Decision

We've created 2 GitHub Actions:

1. One for deploying to the VS Code Marketplace
2. One for deploying to the Open VSX Registry

These actions trigger on published releases.

## Consequences

Part of the release is still manual, because they still provide some value that doesn't feel worth to automate:

- Deciding on a release title
- Updating the Changelog that has a custom format
- Create a GitHub release with the proper title

When a GitHub release is created, there's no further step needed. The new version is deployed automatically to both registry!

Releases can be generated from any computer, without the need to set up an access token locally.

`vsce` and `ovsx` need to be installed locally so the actions can work reliably.
