export { Refactoring };

// String values must match `command` fields in `package.json`
enum Refactoring {
  RenameSymbol = "refactorix.renameSymbol",
  ExtractVariable = "refactorix.extractVariable",
  InlineVariable = "refactorix.inlineVariable"
}
