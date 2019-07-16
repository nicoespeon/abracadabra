export { RefactoringCommand };

// String values must match `command` fields in `package.json`
enum RefactoringCommand {
  RenameSymbol = "abracadabra.renameSymbol",
  InlineVariable = "abracadabra.inlineVariable",
  NegateExpression = "abracadabra.negateExpression",
  RemoveRedundantElse = "abracadabra.removeRedundantElse",
  FlipIfElse = "abracadabra.flipIfElse",
  FlipTernary = "abracadabra.flipTernary",
  MoveStatementUp = "abracadabra.moveStatementUp",
  MoveStatementDown = "abracadabra.moveStatementDown"
}
