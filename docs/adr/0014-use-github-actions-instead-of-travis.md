# 14. Use GitHub Actions instead of Travis

Date: 2023-10-28

## Status

Accepted

## Context

Often, when contributing to the extension after a few months of inactivity, [Travis CI](https://travis-ci.com/) would stop working.

In general, it's because I ran out of OSS credits. I need to ask Travis support for credit to keep running the actions. I get 25k credits than usually run out after a few months.

Sometimes, it may just not be working since it depends both on GitHub notifying Travis, but also on Travis status itself. And sometimes, I've experienced that Travis does not trigger a build, even though there are credits and Travis status says everything is OK.

Without Travis CI, there is no easy and public way to know that nothing has broken before making a release.

We already use GitHub Actions for automating the deployments when a tag is created.

## Decision

Use GitHub Actions to run the automated tests on commits

## Consequences

- Automated actions of Abracadabra will only depend on GitHub
- Fewer time lost managing Travis on top of the rest of the project
- In particular, no more asking Travis Support about OSS credits every 6 months
- If GitHub Actions are down, tests won't run (which is still better than today, GitHub being more reliable than Travis in my experience)
