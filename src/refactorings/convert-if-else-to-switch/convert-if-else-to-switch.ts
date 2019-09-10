import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as ast from "../../ast";

export { convertIfElseToSwitch, hasIfElseToConvert };

async function convertIfElseToSwitch(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(code, selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFoundIfElseToConvert);
    return;
  }

  await editor.write(updatedCode.code);
}

function hasIfElseToConvert(code: Code, selection: Selection): boolean {
  return updateCode(code, selection).hasCodeChanged;
}

function updateCode(code: Code, selection: Selection): ast.Transformed {
  return ast.transform(code, {
    IfStatement(path) {
      if (!selection.isInsidePath(path)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      const convertedNode = new IfElseToSwitch(path).convert();
      path.replaceWith(convertedNode);
    }
  });
}

function hasChildWhichMatchesSelection(
  path: ast.NodePath,
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
  private path: ast.NodePath<ast.IfStatement>;
  private discriminant: ast.Expression | undefined;
  private cases: ast.SwitchCase[] = [];

  constructor(path: ast.NodePath<ast.IfStatement>) {
    this.path = path;
  }

  convert(): ast.Node {
    this.convertNode(this.path.node);

    return this.discriminant
      ? ast.switchStatement(this.discriminant, this.cases)
      : this.path.node;
  }

  private convertNode(node: ast.IfStatement) {
    this.convertConsequent(node);
    this.convertAlternate(node);
  }

  private convertConsequent(statement: ast.IfStatement) {
    const switchStatement = ast.toSwitch(statement.test);
    if (!switchStatement) return;

    const { discriminant, test } = switchStatement;

    this.discriminant = discriminant;
    this.addCase(test, statement.consequent);
  }

  private convertAlternate({ alternate }: ast.IfStatement) {
    if (!alternate) return;

    if (ast.isIfStatement(alternate)) {
      this.convertNode(alternate);
      return;
    }

    this.addDefault(alternate);
  }

  private addDefault(statement: ast.Statement) {
    this.addCase(null, statement);
  }

  private addCase(test: ast.SwitchCase["test"], statement: ast.Statement) {
    const consequent = ast.isBlockStatement(statement)
      ? statement.body
      : [statement];

    const newCase = ast.switchCase(test, [...consequent, ast.breakStatement()]);
    this.cases.push(newCase);
  }
}
