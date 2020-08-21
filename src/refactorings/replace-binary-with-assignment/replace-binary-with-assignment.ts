import { Editor, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export {
  replaceBinaryWithAssignment,
  createVisitor as canReplaceBinaryWithAssignment
};

async function replaceBinaryWithAssignment(editor: Editor) {
  const { code, selection } = editor;
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode || !updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindBinaryExpression);
    return;
  }

  await editor.write(updatedCode.code);
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

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  const result = t.transformAST(
    ast,
    createVisitor(selection, (path: t.NodePath<t.AssignmentExpression>) => {
      const { node } = path;

      const identifier = node.left;
      const binaryExpression = node.right as t.BinaryExpression;
      const operator = binaryExpression.operator;

      const isIdentifierOnTheRight = t.areEquivalent(
        identifier,
        binaryExpression.right
      );

      const newRight = isIdentifierOnTheRight
        ? binaryExpression.left
        : binaryExpression.right;

      path.replaceWith(
        t.assignmentExpression(`${operator}=`, identifier, newRight)
      );
      path.stop();
    })
  );

  return result;
}

function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<t.AssignmentExpression>) => void
): t.Visitor {
  return {
    AssignmentExpression(path) {
      const { node } = path;
      if (!selection.isInsideNode(node)) return;
      if (!t.isBinaryExpression(node.right)) return;

      const identifier = node.left;
      const binaryExpression = node.right;
      const operator = binaryExpression.operator;

      const isIdentifierOnTheLeft = t.areEquivalent(
        identifier,
        binaryExpression.left
      );

      // If the operator is symmetric, the identifier can be on the right.
      const isSymmetricOperator = symmetricOperators.includes(operator);
      const isIdentifierOnTheRight = t.areEquivalent(
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

      onMatch(path);
    }
  };
}
