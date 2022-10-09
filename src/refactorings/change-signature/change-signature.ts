import { Editor, SelectedPosition } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";
import { Path } from "../../editor/path";

let toModifyNode: t.FunctionDeclaration;

export async function changeSignature(editor: Editor) {
  if (!toModifyNode) return;

  const params = toModifyNode.params.map((p) => {
    const name = t.isIdentifier(p) ? p.name : "unknown";

    return {
      label: name
    };
  });

  editor.askForPositions(params, async (message) => {
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

      const transformed = updateCode(
        t.parse(codeToTransform),
        x.selection,
        message
      );

      alreadyTransformed[x.path.value] = `${transformed.code}`;

      result.push({
        path: x.path,
        transformed
      });
    });

    await Promise.all(
      result.map(async (result) => {
        await editor.writeIn(
          result.path,
          alreadyTransformed[result.path.value]
        );

        return true;
      })
    );
  });
}

function updateCode(
  ast: t.AST,
  selection: Selection,
  orders: SelectedPosition[]
): t.Transformed {
  return t.transformAST(
    ast,
    createAVisitor(selection, (path) => {
      const node = path.node;

      if (t.isCallExpression(node)) {
        const args = node.arguments.slice();
        orders.forEach((order) => {
          const arg = node.arguments[order.value.startAt];
          args[order.value.endAt] = arg;
        });

        node.arguments = args;
      } else if (t.isFunctionDeclaration(node)) {
        const params = node.params.slice();
        orders.forEach((order) => {
          const arg = node.params[order.value.startAt];
          params[order.value.endAt] = arg;
        });

        node.params = params;
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

      toModifyNode = path.node;
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
