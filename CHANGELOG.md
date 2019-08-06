# Changelog

All notable changes to the **Abracadabra** extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

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

[unreleased]: https://github.com/nicoespeon/abracadabra/compare/0.2.0...HEAD
[0.2.0]: https://github.com/nicoespeon/abracadabra/compare/0.1.0...0.2.0
[0.1.0]: https://github.com/nicoespeon/abracadabra/compare/0.0.1...0.1.0
[0.0.1]: https://github.com/nicoespeon/abracadabra/compare/224558fafc2c9247b637a74a7f17fe3c62140d47...0.0.1
