import * as t from "../../ast";
import { Editor, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";

export async function convertToArrowFunction(editor: Editor) {
  const { code, selection } = editor;
  const { updatedCode, hasReferenceBefore } = updateCode(
    t.parse(code),
    selection
  );

  if (hasReferenceBefore) {
    editor.showError(
      ErrorReason.CantConvertFunctionDeclarationBecauseUsedBefore
    );
    return;
  }

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindFunctionDeclarationToConvert);
    return;
  }

  await editor.write(updatedCode.code);
}

function updateCode(
  ast: t.AST,
  selection: Selection
): { updatedCode: t.Transformed; hasReferenceBefore: boolean } {
  let hasReferenceBefore = false;
  const updatedCode = t.transformAST(
    ast,
    createVisitor(selection, (path) => {
      let converter: Converter;
      if (path.parentPath.isExportDefaultDeclaration()) {
        converter = new DefaultExportChildConverter(path);
      } else if (path.isFunctionDeclaration()) {
        converter = new FunctionDeclarationConverter(path);
      } else {
        converter = new FunctionExpressionConverter(
          path as t.NodePath<t.FunctionExpression>
        );
      }

      if (converter.hasReferenceBefore) {
        hasReferenceBefore = true;
        path.stop();
        return;
      }

      converter.replaceNode();
      path.stop();
    })
  );

  return { updatedCode, hasReferenceBefore };
}

interface Converter {
  hasReferenceBefore: boolean;
  replaceNode: () => void;
}

class DefaultExportChildConverter implements Converter {
  constructor(
    private path: t.NodePath<t.FunctionDeclaration | t.FunctionExpression>
  ) {}

  readonly hasReferenceBefore = false;

  replaceNode() {
    const { node } = this.path;

    const name = node.id ? node.id.name : "converted";
    const identifier = t.identifier(name);
    const declarator = t.variableDeclarator(
      identifier,
      t.toArrowFunctionExpression(this.path)
    );

    const newNode = t.variableDeclaration("const", [declarator]);

    this.path.insertBefore(newNode);
    t.replaceWithPreservingComments(this.path, t.identifier(name));
  }
}

class FunctionDeclarationConverter implements Converter {
  constructor(private path: t.NodePath<t.FunctionDeclaration>) {}

  replaceNode() {
    const { node } = this.path;

    const name = node.id ? node.id.name : "converted";
    const identifier = t.identifier(name);
    const declarator = t.variableDeclarator(
      identifier,
      t.toArrowFunctionExpression(this.path)
    );

    const newNode = t.variableDeclaration("const", [declarator]);

    t.replaceWithPreservingComments(this.path, newNode);
  }

  get hasReferenceBefore() {
    if (!t.isSelectablePath(this.path)) return false;

    const pathSelection = Selection.fromAST(this.path.node.loc);
    return t.referencesInScope(this.path).some((reference) => {
      if (!t.isSelectablePath(reference)) return false;

      const referenceSelection = Selection.fromAST(reference.node.loc);
      return (
        !referenceSelection.isEqualTo(pathSelection) &&
        referenceSelection.startsBefore(pathSelection) &&
        !hasFunctionScopeBetween(this.path, reference)
      );
    });
  }
}

function hasFunctionScopeBetween(
  path: t.NodePath,
  otherPath: t.NodePath
): boolean {
  // If they is an intermediate scope, the function parent will be different
  return !t.areEquivalent(
    path.getFunctionParent()?.node,
    otherPath.getFunctionParent()?.node
  );
}

class FunctionExpressionConverter implements Converter {
  constructor(private path: t.NodePath<t.FunctionExpression>) {}

  readonly hasReferenceBefore = false;

  replaceNode() {
    const newNode = t.toArrowFunctionExpression(this.path);
    t.replaceWithPreservingComments(this.path, newNode);
  }
}

export function createVisitor(
  selection: Selection,
  onMatch: (
    path: t.NodePath<t.FunctionDeclaration | t.FunctionExpression>
  ) => void
): t.Visitor {
  const onEnterFunctionPath = (
    path: t.NodePath<t.FunctionDeclaration | t.FunctionExpression>
  ) => {
    if (!selection.isInsidePath(path)) return;
    if (selection.isInsidePath(path.get("body"))) return;

    // Since we visit nodes from parent to children, first check
    // if a child would match the selection closer.
    if (hasChildWhichMatchesSelection(path, selection)) return;

    onMatch(path);
  };

  return {
    FunctionDeclaration: onEnterFunctionPath,
    FunctionExpression: onEnterFunctionPath
  };
}

function hasChildWhichMatchesSelection(
  path: t.NodePath,
  selection: Selection
): boolean {
  let result = false;

  const onEnterFunctionPath = (
    childPath: t.NodePath<t.FunctionDeclaration | t.FunctionExpression>
  ) => {
    if (!selection.isInsidePath(childPath)) return;

    result = true;
    childPath.stop();
  };

  path.traverse({
    FunctionDeclaration: onEnterFunctionPath,
    FunctionExpression: onEnterFunctionPath
  });

  return result;
}
