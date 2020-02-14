import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { convertIfElseToSwitch, hasIfElseToConvertVisitorFactory };

async function convertIfElseToSwitch(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFoundIfElseToConvert);
    return;
  }

  await editor.write(updatedCode.code);
}

function hasIfElseToConvertVisitorFactory(
  selection: Selection,
  onMatch: (path: t.NodePath<any>) => void
): t.Visitor {
  return createVisitor(selection, onMatch);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path, convertedNode) => {
      path.replaceWith(convertedNode);
    })
  );
}

function createVisitor(
  selection: Selection,
  onMatch: (
    path: t.NodePath<t.IfStatement>,
    convertedNode: t.IfStatement | t.SwitchStatement
  ) => void
): t.Visitor {
  return {
    IfStatement(path) {
      if (!selection.isInsidePath(path)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      const convertedNode = new IfElseToSwitch(path).convert();
      if (convertedNode === path.node) return;

      onMatch(path, convertedNode);
      path.stop();
    }
  };
}

function hasChildWhichMatchesSelection(
  path: t.NodePath,
  selection: Selection
): boolean {
  let result = false;

  path.traverse({
    IfStatement(childPath) {
      if (!selection.isInsidePath(childPath)) return;

      const convertedNode = new IfElseToSwitch(childPath).convert();
      if (convertedNode === childPath.node) return;

      result = true;
      childPath.stop();
    }
  });

  return result;
}

class IfElseToSwitch {
  private path: t.NodePath<t.IfStatement>;
  private discriminant: t.Expression | undefined;
  private cases: t.SwitchCase[] = [];
  private canConvertAllBranches = true;

  constructor(path: t.NodePath<t.IfStatement>) {
    this.path = path;
  }

  convert(): t.SwitchStatement | t.IfStatement {
    this.convertNode(this.path.node);

    return this.discriminant && this.canConvertAllBranches
      ? t.switchStatement(this.discriminant, this.cases)
      : this.path.node;
  }

  private convertNode(node: t.IfStatement) {
    this.convertConsequent(node);
    this.convertAlternate(node);
  }

  private convertConsequent(statement: t.IfStatement) {
    const switchStatement = t.toSwitch(statement.test);

    if (!switchStatement) {
      this.canConvertAllBranches = false;
      return;
    }

    const { discriminant, test } = switchStatement;

    if (!this.discriminant) {
      this.discriminant = discriminant;
    }

    if (!t.areEqual(this.discriminant, discriminant)) {
      this.canConvertAllBranches = false;
    }

    this.addCase(test, statement.consequent);
  }

  private convertAlternate({ alternate }: t.IfStatement) {
    if (!alternate) return;

    if (t.isIfStatement(alternate)) {
      this.convertNode(alternate);
      return;
    }

    this.addDefault(alternate);
  }

  private addDefault(statement: t.Statement) {
    this.addCase(null, statement);
  }

  private addCase(test: t.SwitchCase["test"], statement: t.Statement) {
    const statements = t.getStatements(statement);

    const consequent = t.hasFinalReturn(statements)
      ? statements
      : [...statements, t.breakStatement()];

    this.cases.push(t.switchCase(test, consequent));
  }
}
