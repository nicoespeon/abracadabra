import { Editor } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";
import { Path } from "../../editor/path";

export async function changeSignature(editor: Editor) {
  const { selection } = editor;
  const refrences = await editor.getSelectionReferences(selection);

  const filesContent = await Promise.all(
    refrences.map(async (reference) => {
      const content = await editor.codeOf(reference.path);
      return {
        code: content,
        path: reference.path,
        selection: reference.selection
      };
    })
  );

  const alreadyTransformed: Record<string, string> = {};
  const result: {
    path: Path;
    transformed: t.Transformed;
  }[] = [];
  filesContent.forEach((x) => {
    const codeToTransform =
      alreadyTransformed[x.path.value] || (x.code as string);
    const transformed = updateCode(t.parse(codeToTransform), x.selection);

    alreadyTransformed[x.path.value] = `${transformed.code}`;

    result.push({
      path: x.path,
      transformed
    });
  });

  await Promise.all(
    result.map(async (result) => {
      await editor.writeIn(result.path, alreadyTransformed[result.path.value]);

      return true;
    })
  );
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createAVisitor(selection, (path) => {
      const node = path.node;

      if (t.isCallExpression(node)) {
        node.arguments = [node.arguments[1], node.arguments[0]];
      } else if (t.isFunctionDeclaration(node)) {
        node.params = [node.params[1], node.params[0]];
      }

      path.stop();
    })
  );
}

export function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath) => void
): t.Visitor {
  return {
    FunctionDeclaration(path) {
      if (!selection.isInsidePath(path)) return;

      onMatch(path);
    }
  };
}

function createAVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath) => void
): t.Visitor {
  return {
    CallExpression(path) {
      const nodeSelection = new Selection(
        [path.node.loc?.start.line || 0, 0],
        [path.node.loc?.end.line || 0, 0]
      );
      if (!selection.isSameLineThan(nodeSelection)) return;

      onMatch(path);
    },
    FunctionDeclaration(path) {
      if (!selection.isInsidePath(path)) return;
      onMatch(path);
    }
  };
}
