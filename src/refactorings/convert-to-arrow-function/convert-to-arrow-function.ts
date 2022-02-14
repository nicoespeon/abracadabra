import { Editor, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export async function convertToArrowFunction(editor: Editor) {
  const { code, selection } = editor;
  const { updatedCode, hasReferenceBefore } = updateCode(
    t.parse(code),
    selection
  );

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindFunctionDeclarationToConvert);
    return;
  }

  if (hasReferenceBefore) {
    editor.showError(
      ErrorReason.CantConvertFunctionDeclarationBecauseUsedBefore
    );
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
      if (path.isFunctionDeclaration()) {
        converter = new FunctionDeclarationConverter(path);
      } else {
        converter = new FunctionExpressionConverter(
          path as t.NodePath<t.FunctionExpression>
        );
      }

      hasReferenceBefore = converter.hasReferenceBefore;
      path.replaceWith(converter.replacementNode);
      path.stop();
    })
  );

  return { updatedCode, hasReferenceBefore };
}

interface Converter {
  hasReferenceBefore: boolean;
  replacementNode: t.Node;
}

class FunctionDeclarationConverter implements Converter {
  constructor(private path: t.NodePath<t.FunctionDeclaration>) {}

  get replacementNode() {
    const { node } = this.path;

    const name = node.id ? node.id.name : "converted";
    const identifier = t.identifier(name);
    const declarator = t.variableDeclarator(
      identifier,
      t.toArrowFunctionExpression(this.path)
    );

    const variableDeclaration = t.variableDeclaration("const", [declarator]);
    // @ts-expect-error Recast does use a `comments` attribute.
    variableDeclaration.comments = node.comments;

    return variableDeclaration;
  }

  get hasReferenceBefore() {
    if (!t.isSelectablePath(this.path)) return false;

    const pathSelection = Selection.fromAST(this.path.node.loc);
    return t.referencesInScope(this.path).some((reference) => {
      if (!t.isSelectablePath(reference)) return false;

      const referenceSelection = Selection.fromAST(reference.node.loc);
      return (
        !referenceSelection.isEqualTo(pathSelection) &&
        referenceSelection.startsBefore(pathSelection)
      );
    });
  }
}

class FunctionExpressionConverter implements Converter {
  constructor(private path: t.NodePath<t.FunctionExpression>) {}

  readonly hasReferenceBefore = false;

  get replacementNode() {
    return t.toArrowFunctionExpression(this.path);
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
    // It seems a function declaration inside a named export may have no loc.
    // Use the named export loc in that situation.
    if (
      t.isExportNamedDeclaration(path.parent) &&
      !t.isSelectableNode(path.node)
    ) {
      path.node.loc = path.parent.loc;
    }

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
