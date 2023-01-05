import { Editor, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export async function mergeIfStatements(editor: Editor) {
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
    createVisitor(selection, (path, mergeIfStatements) => {
      mergeIfStatements.execute();
      path.stop();
    })
  );
}

export function createVisitor(
  selection: Selection,
  onMatch: (
    path: t.NodePath<t.IfStatement>,
    mergeIfStatements: MergeIfStatements
  ) => void
): t.Visitor {
  return {
    IfStatement(path) {
      if (!selection.isInsidePath(path)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      const mergeIfStatements = createMergeIfStatements(path);
      if (mergeIfStatements.canExecute) {
        onMatch(path, mergeIfStatements);
      }
    }
  };
}

function createMergeIfStatements(
  path: t.SelectablePath<t.IfStatement>
): MergeIfStatements {
  const result = new NoMerge(path);

  if (t.hasAlternate(path)) {
    result
      .setNext(new MergeAlternateWithNestedIf(path))
      .setNext(new MergeAlternateAndConsequent(path));
  }

  return result
    .setNext(new MergeConsequentWithPreviousSibling(path))
    .setNext(new MergeConsequentWithNextSibling(path))
    .setNext(new MergeConsequentWithNestedIf(path));
}

abstract class MergeIfStatements<T = t.IfStatement> {
  private next: MergeIfStatements | null = null;

  constructor(protected path: t.NodePath<T>) {}

  setNext(mergeIfStatements: MergeIfStatements): this {
    if (this.next) {
      this.next.setNext(mergeIfStatements);
    } else {
      this.next = mergeIfStatements;
    }

    return this;
  }

  get canExecute(): boolean {
    return this.canMerge || Boolean(this.next?.canExecute);
  }

  execute(): void {
    if (!this.canMerge) return this.next?.execute();
    return this.merge();
  }

  protected abstract readonly canMerge: boolean;
  protected abstract merge(): void;
}

class NoMerge extends MergeIfStatements {
  get canMerge(): boolean {
    return false;
  }

  merge() {
    /** Do nothing */
  }
}

class MergeConsequentWithPreviousSibling extends MergeIfStatements {
  get canMerge(): boolean {
    const previousSibling = t.getPreviousSibling(this.path);
    if (!previousSibling) return false;

    return canMergeIfStatementWithPath(this.path, previousSibling);
  }

  merge(): void {
    const previousSibling = t.getPreviousSibling(this.path);
    if (!previousSibling) return;
    if (!previousSibling.isIfStatement()) return;

    previousSibling.node.test = t.logicalExpression(
      "||",
      previousSibling.node.test,
      this.path.node.test
    );
    this.path.remove();
  }
}

class MergeConsequentWithNextSibling extends MergeIfStatements {
  get canMerge(): boolean {
    const nextSibling = t.getNextSibling(this.path);
    if (!nextSibling) return false;

    return canMergeIfStatementWithPath(this.path, nextSibling);
  }

  merge(): void {
    const nextSibling = t.getNextSibling(this.path);
    if (!nextSibling) return;
    if (!nextSibling.isIfStatement()) return;

    nextSibling.node.test = t.logicalExpression(
      "||",
      this.path.node.test,
      nextSibling.node.test
    );
    this.path.remove();
  }
}

function canMergeIfStatementWithPath(
  ifStatement: t.NodePath<t.IfStatement>,
  otherPath: t.NodePath
): boolean {
  if (!otherPath.isIfStatement()) return false;

  const bothCanBeMerged = [ifStatement, otherPath].every((path) => {
    if (t.hasAlternate(path)) return false;

    const body = t.getStatements(path.node.consequent);
    if (body.length !== 1) return false;
    if (!t.isReturnStatement(body[0])) return false;

    return true;
  });

  const bothAreEquivalent = t.areEquivalent(
    t.getStatements(ifStatement.node.consequent)[0],
    t.getStatements(otherPath.node.consequent)[0]
  );

  return bothCanBeMerged && bothAreEquivalent;
}

class MergeConsequentWithNestedIf extends MergeIfStatements {
  get canMerge(): boolean {
    const nestedIfStatement = getNestedIfStatementIn(this.path.node.consequent);
    return (
      !this.path.node.alternate &&
      nestedIfStatement !== null &&
      !nestedIfStatement.alternate
    );
  }

  merge(): void {
    const nestedIfStatement = getNestedIfStatementIn(this.path.node.consequent);
    if (!nestedIfStatement) return;

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

class MergeAlternateWithNestedIf extends MergeIfStatements<t.IfStatementWithAlternate> {
  get canMerge(): boolean {
    return (
      t.isBlockStatement(this.path.node.alternate) &&
      Boolean(getNestedIfStatementIn(this.path.node.alternate))
    );
  }

  merge(): void {
    const nestedStatement = getNestedIfStatementIn(this.path.node.alternate);
    if (!nestedStatement) return;

    this.path.node.alternate = nestedStatement;
  }
}

class MergeAlternateAndConsequent extends MergeIfStatements<t.IfStatementWithAlternate> {
  get canMerge(): boolean {
    const nestedStatement = getNestedIfStatementIn(this.path.node.alternate);
    if (!t.isIfStatement(nestedStatement)) return false;

    // @ts-expect-error Technically, we're not copying the methods properly
    const ifWithoutAlternate: t.NodePath<t.IfStatement> = {
      ...this.path,
      node: { ...this.path.node, alternate: null }
    };
    const alternatePath: t.NodePath = this.path.get("alternate");
    if (!canMergeIfStatementWithPath(ifWithoutAlternate, alternatePath))
      return false;

    return true;
  }

  merge(): void {
    const nestedStatement = getNestedIfStatementIn(this.path.node.alternate);
    if (!t.isIfStatement(nestedStatement)) return;

    const test = t.logicalExpression(
      "||",
      this.path.node.test,
      nestedStatement.test
    );
    this.path.replaceWith(t.ifStatement(test, this.path.node.consequent));
  }
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
