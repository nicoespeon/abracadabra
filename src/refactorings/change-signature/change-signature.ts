import { Editor } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";
import { Path } from "../../editor/path";
import * as vscode from "vscode";

export async function changeSignature(editor: Editor) {
  askForParamsPositions(async (message) => {
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

    const newValues = JSON.parse(message.values);

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
        newValues
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

function askForParamsPositions(
  callback: (message: Record<string, string>) => Promise<void>
) {
  const panel = vscode.window.createWebviewPanel(
    "changeSignature",
    "Change function signature",
    vscode.ViewColumn.Beside,
    {}
  );

  panel.webview.options = {
    enableScripts: true
  };
  panel.webview.html = getMyWebviewContent(panel.webview);

  panel.webview.onDidReceiveMessage(async (message) => {
    await callback(message);
    panel.dispose();
    vscode.window.showInformationMessage("Done");
  }, undefined);
}

function updateCode(
  ast: t.AST,
  selection: Selection,
  orders: { name: string; startAt: number; endAt: number }[]
): t.Transformed {
  return t.transformAST(
    ast,
    createAVisitor(selection, (path) => {
      const node = path.node;

      if (t.isCallExpression(node)) {
        const args = node.arguments.slice();
        orders.forEach((order) => {
          const arg = node.arguments[order.startAt];
          args[order.endAt] = arg;
        });

        node.arguments = args;
      } else if (t.isFunctionDeclaration(node)) {
        const params = node.params.slice();
        orders.forEach((order) => {
          const arg = node.params[order.startAt];
          params[order.endAt] = arg;
        });

        node.params = params;
      }

      path.stop();
    })
  );
}

let toModifyNode: t.FunctionDeclaration;

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

function getMyWebviewContent(_webview: vscode.Webview): string {
  const params = toModifyNode?.params;

  const paramsTrValues = params.map((param) => {
    const name = t.isIdentifier(param) ? param.name : "";
    return `
      <tr>
          <td class="params-name">${name}</td>
          <td>
            <span class="up"></span>
            <span class="down"></span>
          </td>
        </tr>
    `;
  });

  const html = `
   <!DOCTYPE html>
<html lang="en">
  <head>
    <style>
      table {
        font-family: arial, sans-serif;
        border-collapse: collapse;
      }

      td,
      th {
        border: 1px solid #dddddd;
        text-align: left;
        padding: 8px;
      }

      th:last-child {
        border-top-color: transparent;
        border-right-color: transparent;
      }

      .up,
      .down {
        cursor: pointer;
        display: inline-block;
        width: 8px;
        margin: 0 0.7rem;
        font-size: 1.2rem;
      }

      .up:after {
        content: "▲";
      }

      .up:hover:after {
        color: #625e5e;
      }

      .down:after {
        content: "▼";
      }

      .down:hover:after {
        color: #625e5e;
      }

      button {
        border: 1px solid transparent;
        border-radius: 5px;
        line-height: 1.25rem;
        outline: none;
        padding: 12px 24px;
        text-align: center;
        white-space: nowrap;
        display: inline-block;
        text-decoration: none;
        font-size: 1rem;
        background-color: transparent;
      }

      button:hover {
        cursor: pointer;
        color: #1e1818;
      }
    </style>
  </head>

  <body>
    <h4>Parameters</h4>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th><button id="confirm">Confirm</button></th>
        </tr>
      </thead>

      <tbody id="params">
        ${paramsTrValues.join("")}
      </tbody>
    </table>

    <div class="btn-wrapper"></div>

    <script>
      const vscode = acquireVsCodeApi();
      const startValues = document.querySelectorAll("#params .params-name");
      function moveUp(element) {
        if (element.previousElementSibling)
          element.parentNode.insertBefore(
            element,
            element.previousElementSibling
          );
      }

      function moveDown(element) {
        if (element.nextElementSibling)
          element.parentNode.insertBefore(element.nextElementSibling, element);
      }

      document.querySelector("#params").addEventListener("click", function (e) {
        if (e.target.className === "down")
          moveDown(e.target.parentNode.parentNode);
        else if (e.target.className === "up")
          moveUp(e.target.parentNode.parentNode);
      });

      document.querySelector("#confirm").addEventListener("click", () => {
        const tdsElements = document.querySelectorAll("#params .params-name");
        const tds = Array.from(tdsElements);

        const items = Array.from(startValues).map((item, index) => {
          const endAt = tds.findIndex((td) => td === item);

          return {
            name: item.innerHTML,
            startAt: index,
            endAt: endAt
          };
        });

        vscode.postMessage({
          command: "changed",
          values: JSON.stringify(items)
        });
      });
    </script>
  </body>
</html>
  `;
  return html;
}
