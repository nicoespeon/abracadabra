import { Editor, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";
import * as vscode from "vscode";

export async function changeSignature(editor: Editor) {
  const { selection } = editor;

  const locations = (await vscode.commands.executeCommand(
    "vscode.executeReferenceProvider",
    // @ts-ignore
    editor.document.uri,
    selection.start
  )) as vscode.Location[];

  const filesContent = await Promise.all(
    locations.map(async (loc) => {
      const content = await editor.codeOfByUri(loc.uri);
      const start = loc.range.start;
      const end = loc.range.end;
      return {
        code: `${content}`,
        uri: loc.uri,
        selection: new Selection(
          [start.line + 1, start.character],
          [end.line + 1, end.character]
        )
      };
    })
  );

  const alreadyTransformed: Record<string, string> = {};
  const result: {
    uri: vscode.Uri;
    transformed: t.Transformed;
  }[] = [];
  filesContent.forEach((x) => {
    const codeToTransform =
      alreadyTransformed[x.uri.fsPath] || (x.code as string);
    const transformed = updateCode(t.parse(codeToTransform), x.selection);

    alreadyTransformed[x.uri.fsPath] = `${transformed.code}`;

    result.push({
      uri: x.uri,
      transformed
    });
  });

  await Promise.all(
    result.map(async (result) => {
      if (!result.transformed.hasCodeChanged) {
        editor.showError(ErrorReason.CantChangeSignatureException);
        return false;
      }

      await editor.writeInByUri(
        result.uri,
        alreadyTransformed[result.uri.fsPath]
      );

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
