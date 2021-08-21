import { Editor, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { mergeIfStatements, createVisitor as canMergeIfStatements };

async function mergeIfStatements(editor: Editor) {
  const { code, selection } = editor;
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindIfStatementsToMerge);
    return;
  }

  await editor.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path: t.NodePath<t.IfStatement>) => {
      const { alternate, consequent } = path.node;

      if (alternate) {
        mergeAlternateWithNestedIf(path, alternate);
      } else {
        mergeConsequentWithNestedIf(path, consequent);
      }

      path.stop();
    })
  );
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

      const { alternate, consequent } = path.node;

      if (alternate) {
        if (!t.isBlockStatement(alternate)) return;

        const nestedIfStatement = getNestedIfStatementIn(alternate);
        if (!nestedIfStatement) return;
      } else {
        const nestedIfStatement = getNestedIfStatementIn(consequent);
        if (!nestedIfStatement) return;
        if (nestedIfStatement.alternate) return;
      }

      onMatch(path);
    }
  };
}

class MergeConsequentWithNestedIf implements MergeIfStatements {
  constructor(
    private path: t.NodePath<t.IfStatement>,
    private consequent: t.IfStatement["consequent"]
  ) {}

  execute(): void {
    const nestedIfStatement = getNestedIfStatementIn(this.consequent);
    if (!nestedIfStatement) return;
    if (nestedIfStatement.alternate) return;

    this.path.node.test = t.logicalExpression(
      "&&",
      this.path.node.test,
      nestedIfStatement.test
    );
    this.path.node.consequent = t.blockStatement(
      t.getStatements(nestedIfStatement.consequent)
    );
  }
}

class MergeAlternateWithNestedIf implements MergeIfStatements {
  constructor(
    private path: t.NodePath<t.IfStatement>,
    private alternate: t.IfStatement["alternate"]
  ) {}

  execute(): void {
    if (!t.isBlockStatement(this.alternate)) return;

    const nestedStatement = getNestedIfStatementIn(this.alternate);
    if (!nestedStatement) return;

    this.path.node.alternate = nestedStatement;
  }
}

interface MergeIfStatements {
  execute(): void;
}

function mergeAlternateWithNestedIf(
  path: t.NodePath<t.IfStatement>,
  alternate: t.IfStatement["alternate"]
) {
  new MergeAlternateWithNestedIf(path, alternate).execute();
}

function mergeConsequentWithNestedIf(
  path: t.NodePath<t.IfStatement>,
  consequent: t.IfStatement["consequent"]
) {
  new MergeConsequentWithNestedIf(path, consequent).execute();
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
