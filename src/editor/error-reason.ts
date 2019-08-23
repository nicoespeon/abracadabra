export { ErrorReason, toString };

enum ErrorReason {
  DidNotFoundBinaryExpression,
  DidNotFoundExtractableCode,
  DidNotFoundInlinableCode,
  DidNotFoundInlinableCodeIdentifiers,
  DidNotFoundNegatableExpression,
  DidNotFoundRedundantElse,
  DidNotFoundIfElseToFlip,
  DidNotFoundTernaryToFlip,
  DidNotFoundIfElseToConvert,
  DidNotFoundTernaryToConvert,
  DidNotFoundArrowFunctionToAddBraces,
  DidNotFoundBracesToRemoveFromArrowFunction,
  DidNotFoundIfStatementToSplit,
  DidNotFoundIfStatementsToMerge,
  DidNotFoundDeclarationToSplit,
  DidNotFoundStringToConvert,
  CantMoveStatementUp,
  CantMoveMultiLinesStatementUp,
  CantMoveStatementDown,
  CantMoveMultiLinesStatementDown,
  CantInlineExportedVariables,
  CantInlineRedeclaredVariables,
  CantRemoveBracesFromArrowFunction,
  CantRemoveExportedFunction,
  CantInlineFunctionWithMultipleReturns,
  CantInlineAssignedFunctionWithoutReturn,
  CantInlineAssignedFunctionWithManyStatements
}

function toString(reason: ErrorReason): string {
  switch (reason) {
    case ErrorReason.DidNotFoundBinaryExpression:
      return didNotFound("a binary expression to convert");

    case ErrorReason.DidNotFoundExtractableCode:
      return didNotFound("a valid code to extract");

    case ErrorReason.DidNotFoundInlinableCode:
      return didNotFound("a valid code to inline");

    case ErrorReason.DidNotFoundInlinableCodeIdentifiers:
      return "I didn't found references of this variable in the code 🤔";

    case ErrorReason.DidNotFoundNegatableExpression:
      return didNotFound("a valid expression to negate");

    case ErrorReason.DidNotFoundRedundantElse:
      return didNotFound("a redundant else to remove");

    case ErrorReason.DidNotFoundIfElseToFlip:
      return didNotFound("an if statement to flip");

    case ErrorReason.DidNotFoundTernaryToFlip:
      return didNotFound("a ternary to flip");

    case ErrorReason.DidNotFoundIfElseToConvert:
      return didNotFound("a valid if statement to convert into ternary");

    case ErrorReason.DidNotFoundTernaryToConvert:
      return didNotFound("a ternary to convert into if statement");

    case ErrorReason.DidNotFoundArrowFunctionToAddBraces:
      return didNotFound("an arrow function to add braces");

    case ErrorReason.DidNotFoundBracesToRemoveFromArrowFunction:
      return didNotFound("braces to remove");

    case ErrorReason.DidNotFoundIfStatementToSplit:
      return didNotFound("an if statement that can be split");

    case ErrorReason.DidNotFoundIfStatementsToMerge:
      return didNotFound("if statements that can be merged");

    case ErrorReason.DidNotFoundDeclarationToSplit:
      return didNotFound("a declaration that can be splitted");

    case ErrorReason.DidNotFoundStringToConvert:
      return didNotFound("a string to convert into template literal");

    case ErrorReason.CantMoveStatementUp:
      return cantDoIt("move this statement up");

    case ErrorReason.CantMoveMultiLinesStatementUp:
      return cantDoIt("move up a multi-lines selection yet");

    case ErrorReason.CantMoveStatementDown:
      return cantDoIt("move this statement down");

    case ErrorReason.CantMoveMultiLinesStatementDown:
      return cantDoIt("move down a multi-lines selection yet");

    case ErrorReason.CantInlineExportedVariables:
      return cantDoIt("inline exported variables yet");

    case ErrorReason.CantInlineRedeclaredVariables:
      return cantDoIt("inline redeclared variables yet");

    case ErrorReason.CantRemoveBracesFromArrowFunction:
      return cantDoIt("remove braces from this arrow function");

    case ErrorReason.CantRemoveExportedFunction:
      return "I didn't remove the function because it's exported 🤓";

    case ErrorReason.CantInlineFunctionWithMultipleReturns:
      return cantDoIt("inline a function with multiple returns");

    case ErrorReason.CantInlineAssignedFunctionWithoutReturn:
      return cantDoIt("inline an assigned function without return");

    case ErrorReason.CantInlineAssignedFunctionWithManyStatements:
      return cantDoIt("inline an assigned function with many statements");

    default:
      return "I'm sorry, something went wrong but I'm not sure what 😅";
  }
}

function didNotFound(element: string): string {
  return `I didn't found ${element} from current selection 🤔`;
}

function cantDoIt(element: string): string {
  return `I'm sorry, I can't ${element} 😅`;
}
