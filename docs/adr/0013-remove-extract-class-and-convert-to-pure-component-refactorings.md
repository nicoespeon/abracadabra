# 13. Remove Extract Class and Convert to Pure Component refactorings

Date: 2023-04-13

## Status

Accepted

Amends [8. Don't propose Quick Fix for React Convert to Pure Component](0008-don-t-propose-quick-fix-for-react-convert-to-pure-component.md)

## Context

Among all refactorings we implemented, 2 are quite different. They are not using the regular process, but instead import their own packages:

- "Extract Class" uses ts-morph
- "Convert to Pure Component" uses jscodeshift and react-codemod

While these were cool demonstrations of the plug-and-play architecture of Abracadabra, it comes at a cost.

In particular, the final bundle contained twice the `typescript.js` file, which is really unefficient for a single refactoring:

![](https://github.com/nicoespeon/abracadabra/blob/main/docs/adr/13-bundle-before.png?raw=true)

The resulting production bundle is ~40 MB (3.5 MB gzipped).

![](https://github.com/nicoespeon/abracadabra/blob/main/docs/adr/13-bundle-before-size.png?raw=true)

It also created some technical debt, since:

- we wanted to refactor the code to retrofit the style of other refactorings (consistency)
- the react-codemod source code has code that generated noise in our tests
- "Convert to Pure Component" is specific to React and [was causing performance issues](0008-don-t-propose-quick-fix-for-react-convert-to-pure-component.md)

Finally, these are edge-case refactorings that are not "core" ones. Even though there is no telemetry to have an objective view on this, these aren't as common as "Extract Variable", say.

## Decision

The following refactorings aren't part of Abracadabra anymore (until re-implemented):

- "Extract Class"
- "Convert to Pure Component"

## Consequences

The production bundle is much smaller:

![](https://github.com/nicoespeon/abracadabra/blob/main/docs/adr/13-bundle-after.png?raw=true)

| Before            | After          |
| ----------------- | -------------- |
| 38.49 MB          | 26.1 MB (-32%) |
| 3.48 MB (gzipped) | 2.42 MB (-30%) |

It should also result in faster bundles and more consistency in the codebase.

On the other hand, we have lost 2 refactorings. These should be re-implemented following what Abracadabra uses today—or at least, ensures the ROI is worth it.
