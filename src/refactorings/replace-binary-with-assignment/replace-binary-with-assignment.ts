import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as ast from "../../ast";

export { replaceBinaryWithAssignment, canReplaceBinaryWithAssignment };

async function replaceBinaryWithAssignment(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(code, selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFoundBinaryExpression);
    return;
  }

  await editor.write(updatedCode.code);
}

function canReplaceBinaryWithAssignment(
  code: Code,
  selection: Selection
): boolean {
  return updateCode(code, selection).hasCodeChanged;
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

function updateCode(code: Code, selection: Selection): ast.Transformed {
  return ast.transform(code, {
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

      path.replaceWith(
        ast.assignmentExpression(
          `${binaryExpression.operator}=`,
          identifier,
          newRight
        )
      );
      path.stop();
    }
  });
}
