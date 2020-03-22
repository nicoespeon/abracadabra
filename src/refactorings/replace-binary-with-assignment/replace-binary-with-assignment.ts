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
    editor.showError(ErrorReason.DidNotFindBinaryExpression);
    return;
  }

  await editor.write(updatedCode.code);
}

function tryToReplaceBinaryWithAssignment(
  ast: t.AST,
  selection: Selection
): { canReplace: boolean; operator: t.BinaryExpression["operator"] } {
  let canReplace = false;
  let operator = "+" as t.BinaryExpression["operator"];

  t.traverseAST(
    ast,
    createVisitor(selection, (path: t.NodePath<t.AssignmentExpression>) => {
      const { node } = path;
      if (!t.isBinaryExpression(node.right)) return;

      const binaryExpression = node.right;
      operator = binaryExpression.operator;

      canReplace = true;
    })
  );

  return {
    canReplace,
    operator
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

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  const result = t.transformAST(
    ast,
    createVisitor(selection, (path: t.NodePath<t.AssignmentExpression>) => {
      const { node } = path;
      if (!t.isBinaryExpression(node.right)) return;

      const identifier = node.left;
      const binaryExpression = node.right;
      const operator = binaryExpression.operator;

      const isIdentifierOnTheRight = t.areEqual(
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

      onMatch(path);
    }
  };
}
