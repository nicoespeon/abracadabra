import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as ast from "../../ast";

export { replaceBinaryWithAssignment, tryToReplaceBinaryWithAssignment };

async function replaceBinaryWithAssignment(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(code, selection);

  if (!updatedCode || !updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFoundBinaryExpression);
    return;
  }

  await editor.write(updatedCode.code);
}

function tryToReplaceBinaryWithAssignment(
  code: Code,
  selection: Selection
): { canReplace: boolean; operator: ast.BinaryExpression["operator"] } {
  const updatedCode = updateCode(code, selection);
  if (!updatedCode) return { canReplace: false, operator: "+" };

  return {
    canReplace: updatedCode.hasCodeChanged,
    operator: updatedCode.operator
  };
}

const assignableOperators = [
  "+",
  "-",
  "/",
  "*",
  "**",
  "%",
  "&",
  "|",
  "^",
  ">>",
  "<<",
  ">>>"
];

function updateCode(
  code: Code,
  selection: Selection
): ast.Transformed & { operator: ast.BinaryExpression["operator"] } | null {
  let operator: ast.BinaryExpression["operator"] | undefined;

  const result = ast.transform(code, {
    AssignmentExpression(path) {
      const { node } = path;
      if (!selection.isInsideNode(node)) return;
      if (!ast.isBinaryExpression(node.right)) return;

      const identifier = node.left;
      const binaryExpression = node.right;

      const isIdentifierOnTheRight = ast.areEqual(
        identifier,
        binaryExpression.right
      );
      const isIdentifierOnTheLeft = ast.areEqual(
        identifier,
        binaryExpression.left
      );

      if (!isIdentifierOnTheRight && !isIdentifierOnTheLeft) return;
      if (!assignableOperators.includes(binaryExpression.operator)) return;

      const newRight = isIdentifierOnTheRight
        ? binaryExpression.left
        : binaryExpression.right;

      operator = binaryExpression.operator;
      path.replaceWith(
        ast.assignmentExpression(`${operator}=`, identifier, newRight)
      );
      path.stop();
    }
  });

  if (!operator) return null;

  return { ...result, operator };
}
