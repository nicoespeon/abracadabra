# 3. Use hosted image links in README

Date: 2019-07-03

## Status

Accepted

## Context

Relative paths for images won't work when the README is displayed somewhere where the images are not hosted. From experience developing npm libraries, images won't appear on the package manager website.

To solve this, we use absolute paths to hosted images. Since images are hosted in GitHub along the rest of the code, we use these absolute paths.

VS Code has a way to deal with that issue. It won't allow you to create a package if README contains relative paths. It will emit this error:

> Couldn't detect the repository where this extension is published. The image './docs/logo/abracadabra-logo.svg' will be broken in README.md. Please provide the repository URL in package.json or use the --baseContentUrl and --baseImagesUrl options.

Thus, we could technically use relative paths and provide the correct arguments to make images work on VS Code Marketplace.

However, using absolute paths is something we're used to, and doesn't come up with a lot of downsides. So we decide to go with absolute paths, until downsides justify otherwise.

## Decision

We use absolute paths to GitHub hosted images in the README (and other documentation files).

We don't use relative paths to images.

## Consequences

Images will always be visible, as long as you can reach GitHub.

It prevents from seing the actual image until it's pushed to `master` on GitHub. We're fine with this downside for now.
