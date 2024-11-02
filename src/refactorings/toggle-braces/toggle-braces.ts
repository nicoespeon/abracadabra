import * as t from "../../ast";
import { Editor, ErrorReason } from "../../editor/editor";
import { Position } from "../../editor/position";
import { Selection } from "../../editor/selection";

export async function toggleBraces(editor: Editor) {
  const { code, selection } = editor;
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindStatementToToggleBraces);
    return;
  }

  await editor.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path, toggleBraces) => {
      toggleBraces.execute();
      path.stop();
    })
  );
}

export function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath, toggleBraces: ToggleBraces) => void
): t.Visitor {
  return {
    IfStatement(path) {
      if (!selection.isInsidePath(path)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      const operation = t.hasBraces(path, selection)
        ? new RemoveBracesFromIfStatement(path, selection)
        : new AddBracesToIfStatement(path, selection);

      if (!operation.canExecute) return;

      onMatch(path, operation);
    },
    JSXAttribute(path) {
      if (!selection.isInsidePath(path)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      const operation = t.isStringLiteral(path.node.value)
        ? new AddBracesToJSXAttribute(path)
        : new RemoveBracesFromJSXAttribute(path);

      if (!operation.canExecute) return;

      onMatch(path, operation);
    },
    ArrowFunctionExpression(path) {
      if (!selection.isInsidePath(path)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      const operation = t.isBlockStatement(path.node.body)
        ? new RemoveBracesFromArrowFunction(path)
        : new AddBracesToArrowFunction(path);

      if (!operation.canExecute) return;

      onMatch(path, operation);
    },
    Loop(path) {
      if (!selection.isInsidePath(path)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      const operation = t.isBlockStatement(path.node.body)
        ? new RemoveBracesFromLoop(path)
        : new AddBracesToLoop(path);

      if (!operation.canExecute) return;

      onMatch(path, operation);
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

      const operation = t.hasBraces(childPath, selection)
        ? new RemoveBracesFromIfStatement(childPath, selection)
        : new AddBracesToIfStatement(childPath, selection);

      if (!operation.canExecute) return;

      result = true;
      childPath.stop();
    },
    JSXAttribute(childPath) {
      if (!selection.isInsidePath(childPath)) return;

      const operation = t.isStringLiteral(childPath.node.value)
        ? new AddBracesToJSXAttribute(childPath)
        : new RemoveBracesFromJSXAttribute(childPath);

      if (!operation.canExecute) return;

      result = true;
      childPath.stop();
    },
    ArrowFunctionExpression(childPath) {
      if (!selection.isInsidePath(childPath)) return;

      const operation = t.isBlockStatement(childPath.node.body)
        ? new RemoveBracesFromArrowFunction(childPath)
        : new AddBracesToArrowFunction(childPath);

      if (!operation.canExecute) return;

      result = true;
      childPath.stop();
    },
    Loop(childPath) {
      if (!selection.isInsidePath(childPath)) return;

      const operation = t.isBlockStatement(childPath.node.body)
        ? new RemoveBracesFromLoop(childPath)
        : new AddBracesToLoop(childPath);

      if (!operation.canExecute) return;

      result = true;
      childPath.stop();
    }
  });

  return result;
}

interface ToggleBraces {
  readonly canExecute: boolean;
  execute(): void;
}

class AddBracesToIfStatement implements ToggleBraces {
  constructor(
    private path: t.NodePath<t.IfStatement>,
    private selection: Selection
  ) {}

  readonly canExecute = true;

  execute() {
    if (!this.canExecute) return;
    if (!t.isSelectableNode(this.path.node.consequent)) return;

    const endOfConsequent = Position.fromAST(this.path.node.consequent.loc.end);

    if (this.selection.start.isBefore(endOfConsequent)) {
      this.path.node.consequent = t.statementWithBraces(
        this.path.node.consequent
      );
    } else if (this.path.node.alternate) {
      this.path.node.alternate = t.statementWithBraces(
        this.path.node.alternate
      );
    }
  }
}

class RemoveBracesFromIfStatement implements ToggleBraces {
  constructor(
    private path: t.NodePath<t.IfStatement>,
    private selection: Selection
  ) {}

  get canExecute(): boolean {
    return t.hasSingleStatementBlock(this.path, this.selection);
  }

  execute() {
    if (!this.canExecute) return;
    if (!t.isSelectableNode(this.path.node.consequent)) return;

    if (this.selection.isBefore(this.path.node.consequent)) {
      this.path.node.consequent = t.statementWithoutBraces(
        this.path.node.consequent
      );
    } else if (this.path.node.alternate) {
      this.path.node.alternate = t.statementWithoutBraces(
        this.path.node.alternate
      );
    }
  }
}

class AddBracesToJSXAttribute implements ToggleBraces {
  constructor(private path: t.NodePath<t.JSXAttribute>) {}

  get canExecute(): boolean {
    return !t.isJSXExpressionContainer(this.path.node.value);
  }

  execute() {
    if (!this.canExecute) return;
    if (!this.path.node.value) return;
    if (t.isJSXExpressionContainer(this.path.node.value)) return;

    this.path.node.value = t.jsxExpressionContainer(this.path.node.value);
  }
}

class RemoveBracesFromJSXAttribute implements ToggleBraces {
  constructor(private path: t.NodePath<t.JSXAttribute>) {}

  get canExecute(): boolean {
    return (
      t.isJSXExpressionContainer(this.path.node.value) &&
      t.isStringLiteral(this.path.node.value.expression)
    );
  }

  execute() {
    if (!this.canExecute) return;
    if (!t.isJSXExpressionContainer(this.path.node.value)) return;
    if (!t.isStringLiteral(this.path.node.value.expression)) return;

    this.path.node.value = t.stringLiteral(
      this.path.node.value.expression.value
    );
  }
}

class AddBracesToArrowFunction implements ToggleBraces {
  constructor(private path: t.NodePath<t.ArrowFunctionExpression>) {}

  get canExecute(): boolean {
    return !t.isBlockStatement(this.path.node.body);
  }

  execute() {
    if (!this.canExecute) return;
    if (t.isBlockStatement(this.path.node.body)) return;

    const blockStatement = t.blockStatement([
      t.returnStatement(this.path.node.body)
    ]);
    this.path.node.body = blockStatement;
  }
}

class RemoveBracesFromArrowFunction implements ToggleBraces {
  constructor(private path: t.NodePath<t.ArrowFunctionExpression>) {}

  get canExecute(): boolean {
    if (!t.isBlockStatement(this.path.node.body)) return false;

    const blockStatementStatements = this.path.node.body.body;
    if (blockStatementStatements.length > 1) return false;

    const firstValue = blockStatementStatements[0];
    if (!t.isReturnStatement(firstValue)) return false;

    if (firstValue.argument === null) return false;

    return true;
  }

  execute() {
    if (!this.canExecute) return;
    if (!t.isBlockStatement(this.path.node.body)) return;

    const blockStatementStatements = this.path.node.body.body;
    const firstValue = blockStatementStatements[0];

    if (!t.isReturnStatement(firstValue)) return;
    if (!firstValue.argument) return;

    this.path.node.body = firstValue.argument;
  }
}

class AddBracesToLoop implements ToggleBraces {
  constructor(private path: t.SelectablePath<t.Loop>) {}

  get canExecute(): boolean {
    return !t.isBlockStatement(this.path.node.body);
  }

  execute() {
    if (!this.canExecute) return;

    const blockStatement = t.statementWithBraces(this.path.node.body);
    this.path.node.body = blockStatement;
  }
}

class RemoveBracesFromLoop implements ToggleBraces {
  constructor(private path: t.SelectablePath<t.Loop>) {}

  get canExecute(): boolean {
    if (!t.isBlockStatement(this.path.node.body)) return false;

    const blockStatementStatements = this.path.node.body.body;
    return blockStatementStatements.length === 1;
  }

  execute() {
    if (!this.canExecute) return;
    if (!t.isBlockStatement(this.path.node.body)) return;

    const blockStatementStatements = this.path.node.body.body;
    const firstValue = blockStatementStatements[0];

    this.path.node.body = firstValue;
  }
}
