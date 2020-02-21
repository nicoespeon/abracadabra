import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { mergeIfStatements, createVisitor as canMergeIfStatements };

async function mergeIfStatements(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFoundIfStatementsToMerge);
    return;
  }

  await editor.write(updatedCode.code);
}

function updateCode(
  ast: t.AST,
  selection: Selection
): t.Transformed & { mergeAlternate: boolean } {
  let mergeAlternate = false;

  const result = t.transformAST(
    ast,
    createVisitor(selection, (path: t.NodePath<t.IfStatement>) => {
      const { alternate, consequent } = path.node;

      if (alternate) {
        mergeAlternate = true;
        mergeAlternateWithNestedIf(path, alternate);
      } else {
        mergeAlternate = false;
        mergeConsequentWithNestedIf(path, consequent);
      }
    })
  );

  return { ...result, mergeAlternate };
}

function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<t.IfStatement>) => void
): t.Visitor {
  return {
    IfStatement(path) {
      if (!selection.isInsidePath(path)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      onMatch(path);
      path.stop();
    }
  };
}

function mergeAlternateWithNestedIf(
  path: t.NodePath<t.IfStatement>,
  alternate: t.IfStatement["alternate"]
) {
  if (!t.isBlockStatement(alternate)) return;

  const nestedStatement = getNestedIfStatementIn(alternate);
  if (!nestedStatement) return;

  path.node.alternate = nestedStatement;
  path.stop();
}

function mergeConsequentWithNestedIf(
  path: t.NodePath<t.IfStatement>,
  consequent: t.IfStatement["consequent"]
) {
  const nestedIfStatement = getNestedIfStatementIn(consequent);
  if (!nestedIfStatement) return;
  if (nestedIfStatement.alternate) return;

  path.node.test = t.logicalExpression(
    "&&",
    path.node.test,
    nestedIfStatement.test
  );
  path.node.consequent = t.blockStatement(
    t.getStatements(nestedIfStatement.consequent)
  );

  path.stop();
}

function hasChildWhichMatchesSelection(
  path: t.NodePath,
  selection: Selection
): boolean {
  let result = false;

  path.traverse({
    IfStatement(childPath) {
      if (!selection.isInsidePath(childPath)) return;

      const { alternate, consequent } = childPath.node;

      if (alternate) {
        /**
         * When cursor is on child `if`, like here:
         *
         *     else {
         *       if (isValid) {
         *       ^^^^^^^^^^^^
         *         doSomething();
         *       } else {
         *         if (isCorrect) {}
         *       }
         *     }
         *
         * It's more intuitive to merge the parent `else` with `if (isValid)`,
         * not the child `else` with `if (isCorrect)` in this situation.
         */
        const selectionOnChildIfKeyword =
          consequent.loc &&
          selection.startsBefore(Selection.fromAST(consequent.loc));
        if (selectionOnChildIfKeyword) return;

        if (!t.isBlockStatement(alternate)) return;

        const nestedIfStatement = getNestedIfStatementIn(alternate);
        if (!nestedIfStatement) return;
      } else {
        const nestedIfStatement = getNestedIfStatementIn(consequent);
        if (!nestedIfStatement) return;
        if (nestedIfStatement.alternate) return;
      }

      result = true;
      childPath.stop();
    }
  });

  return result;
}

function getNestedIfStatementIn(statement: t.Statement): t.IfStatement | null {
  if (t.isBlockStatement(statement) && statement.body.length > 1) {
    return null;
  }

  const nestedIfStatement = t.isBlockStatement(statement)
    ? statement.body[0] // We tested there is no other element in body.
    : statement;
  if (!t.isIfStatement(nestedIfStatement)) return null;

  return nestedIfStatement;
}
