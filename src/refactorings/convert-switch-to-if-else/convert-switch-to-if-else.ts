import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { convertSwitchToIfElse, createVisitor as hasSwitchToConvert };

async function convertSwitchToIfElse(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindSwitchToConvert);
    return;
  }

  await editor.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path, convertedNode) => {
      path.replaceWith(convertedNode);
      path.stop();
    })
  );
}

function createVisitor(
  selection: Selection,
  onMatch: (
    path: t.NodePath<t.SwitchStatement>,
    convertedNode: t.IfStatement | t.SwitchStatement
  ) => void
): t.Visitor {
  return {
    SwitchStatement(path) {
      if (!selection.isInsidePath(path)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      const convertedNode = new SwitchToIfElse(path).convert();
      if (convertedNode === path.node) return;

      onMatch(path, convertedNode);
    }
  };
}

function hasChildWhichMatchesSelection(
  path: t.NodePath,
  selection: Selection
): boolean {
  let result = false;

  path.traverse({
    SwitchStatement(childPath) {
      if (!selection.isInsidePath(childPath)) return;

      const convertedNode = new SwitchToIfElse(childPath).convert();
      if (convertedNode === childPath.node) return;

      result = true;
      childPath.stop();
    }
  });

  return result;
}

class SwitchToIfElse {
  private path: t.NodePath<t.SwitchStatement>;
  private consequents: t.IfStatement[] = [];
  private hasNoFallThrough = true;

  constructor(path: t.NodePath<t.SwitchStatement>) {
    this.path = path;
  }

  convert(): t.SwitchStatement | t.IfStatement {
    this.convertNode(this.path.node);

    return this.path.node;
  }

  private convertNode(node: t.SwitchStatement) {
    // todo
  }
}
