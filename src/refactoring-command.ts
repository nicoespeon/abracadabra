export { RefactoringCommand };

// String values must match `command` fields in `package.json`
enum RefactoringCommand {
  RenameSymbol = "abracadabra.renameSymbol",
  ExtractVariable = "abracadabra.extractVariable",
  InlineVariable = "abracadabra.inlineVariable",
  NegateExpression = "abracadabra.negateExpression",
  RemoveRedundantElse = "abracadabra.removeRedundantElse",
  FlipIfElse = "abracadabra.flipIfElse",
  FlipTernary = "abracadabra.flipTernary",
  ConvertTernaryToIfElse = "abracadabra.convertTernaryToIfElse",
  MoveStatementUp = "abracadabra.moveStatementUp",
  MoveStatementDown = "abracadabra.moveStatementDown"
}
