import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { replaceBinaryWithAssignment, tryToReplaceBinaryWithAssignment };

async function replaceBinaryWithAssignment(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode || !updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFoundBinaryExpression);
    return;
  }

  await editor.write(updatedCode.code);
}

function tryToReplaceBinaryWithAssignment(
  ast: t.AST,
  selection: Selection
): { canReplace: boolean; operator: t.BinaryExpression["operator"] } {
  const updatedCode = updateCode(ast, selection);
  if (!updatedCode) return { canReplace: false, operator: "+" };

  return {
    canReplace: updatedCode.hasCodeChanged,
    operator: updatedCode.operator
  };
}

const symmetricOperators = ["+", "*", "|", "&", "^"];
const assignableOperators = [
  ...symmetricOperators,
  "-",
  "/",
  "**",
  "%",
  ">>",
  "<<",
  ">>>"
];

function updateCode(
  ast: t.AST,
  selection: Selection
): t.Transformed & { operator: t.BinaryExpression["operator"] } | null {
  let operator: t.BinaryExpression["operator"] | undefined;

  const result = t.transformAST(ast, {
    AssignmentExpression(path) {
      const { node } = path;
      if (!selection.isInsideNode(node)) return;
      if (!t.isBinaryExpression(node.right)) return;

      const identifier = node.left;
      const binaryExpression = node.right;
      operator = binaryExpression.operator;

      const isIdentifierOnTheLeft = t.areEqual(
        identifier,
        binaryExpression.left
      );

      // If the operator is symmetric, the identifier can be on the right.
      const isSymmetricOperator = symmetricOperators.includes(operator);
      const isIdentifierOnTheRight = t.areEqual(
        identifier,
        binaryExpression.right
      );

      if (
        !isIdentifierOnTheLeft &&
        (!isSymmetricOperator || !isIdentifierOnTheRight)
      ) {
        return;
      }
      if (!assignableOperators.includes(binaryExpression.operator)) return;

      const newRight = isIdentifierOnTheRight
        ? binaryExpression.left
        : binaryExpression.right;

      path.replaceWith(
        t.assignmentExpression(`${operator}=`, identifier, newRight)
      );
      path.stop();
    }
  });

  if (!operator) return null;

  return { ...result, operator };
}
