import { Editor } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";
import * as vscode from "vscode";

export async function changeSignature(editor: Editor) {
  const { code, selection } = editor;

  console.log(code);
  let xxx = (await vscode.commands.executeCommand(
    "vscode.executeReferenceProvider",
    // @ts-ignore
    editor.document.uri,
    selection.start
  )) as vscode.Location[];

  xxx = xxx.filter(
    (v, i, a) => a.findIndex((v2) => v2.uri.path === v.uri.path) === i
  );

  const filesContent = await Promise.all(
    xxx.map(async (loc) => {
      const content = await editor.codeOfByUri(loc.uri);
      const start = loc.range.start;
      const end = loc.range.end;
      return {
        code: content,
        uri: loc.uri,
        selection: new Selection(
          [start.line, start.character],
          [end.line, end.character]
        )
      };
    })
  );

  const result: {
    uri: vscode.Uri;
    transformed: t.Transformed;
  }[] = [];
  filesContent.forEach((x) => {
    result.push({
      uri: x.uri,
      transformed: updateCode(t.parse(x.code as string), x.selection)
    });
  });

  await Promise.all(
    result.map(async (result) => {
      await editor.writeInByUri(result.uri, result.transformed.code);
    })
  );

  // if (!updatedCode.hasCodeChanged) {
  //   editor.showError(ErrorReason.CantChangeSignatureException);
  //   return;
  // }

  // await editor.write(updatedCode.code);
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
    })
  );
}

export function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath) => void
): t.Visitor {
  return {
    FunctionDeclaration(path) {
      if (!t.hasNodeId(path)) return;
      if (!selection.isInsidePath(path)) return;

      const body = path.get("body");
      if (!t.isSelectablePath(body)) return;

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
      if (!selection.isInsidePath(path)) return;

      onMatch(path);
    },
    FunctionDeclaration(path) {
      if (!selection.isInsidePath(path)) return;
      onMatch(path);
    }
  };
}
