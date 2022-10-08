import { Editor } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";
import { Path } from "../../editor/path";
import * as vscode from "vscode";

export async function changeSignature(editor: Editor) {
  const panel = vscode.window.createWebviewPanel(
    "changeSignature", // <--- identifier
    "Change function signature", // <--- title
    vscode.ViewColumn.One,
    {}
  );

  // And set its HTML content
  panel.webview.options = {
    enableScripts: true
  };
  panel.webview.html = getMyWebviewContent(panel.webview);

  // panel.webview.onDidReceiveMessage(
  //   (message) => {
  //     vscode.window.showErrorMessage(message.text);
  //   },
  //   undefined,
  //   context.subscriptions
  // );

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

  // await Promise.all(
  //   result.map(async (result) => {
  //     await editor.writeIn(result.path, alreadyTransformed[result.path.value]);

  //     return true;
  //   })
  // );
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

function getNameFromNode() {
  const fnName = toModifyNode.id?.name;
  const params = toModifyNode.params.map((node) => {
    return t.isIdentifier(node) ? node.name : "";
  });

  return `${fnName}(${params.join(", ")})`;
}

function getMyWebviewContent(_webview: vscode.Webview): string {
  const params = toModifyNode?.params;

  const paramsValue = params.map((param) => {
    const name = t.isIdentifier(param) ? param.name : "";
    return `
     <li>
        <code>${name}</code><span class="up"></span><span class="down"></span>
      </li>
    `;
  });

  const nonce = getNonce();

  const html = `
    <!DOCTYPE html>
<html lang="en">
  <head>
    <style>
      code {
        font-size: 1.5rem;
        color: #e83e8c;
        word-break: break-word;
      }

      .param {
        display: flex;
        align-items: center;
        flex-direction: row;
        flex-wrap: nowrap;
      }

      ul {
        list-style: none;
      }

      ul li {
        margin: 1rem 0;
      }

      ul code {
        font-size: 1rem;
        display: inline-block;
        margin-right: 1rem;
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
        content: "△";
      }

      .up:hover:after {
        content: "▲";
      }

      .down:after {
        content: "▽";
      }

      .down:hover:after {
        content: "▼";
      }

      .btn-wrapper {
        padding: 40px;
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
        color: #fff;
        background-color: #2fade2;
      }

      button:hover {
        cursor: pointer;
        background-color: #2b91bc;
      }
    </style>
  </head>

  <body>
    <h3><code>${getNameFromNode()}</code></h3>
    <ul id="params">
      ${paramsValue.join("")}
    </ul>

    <div class="btn-wrapper">
      <button id="confirm">Confirm</button>
    </div>

    <script nonce="${nonce}">
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
        if (e.target.className === "down") moveDown(e.target.parentNode);
        else if (e.target.className === "up") moveUp(e.target.parentNode);
      });

      document.querySelector("#confirm").addEventListener("click", () => {
        const lis = document.querySelectorAll("#params li code");

        const values = Array.from(lis).map((li) => {
          return li.innerHTML;
        });

        vscode.postMessage({
                        command: 'alert',
                        text: '🐛  on line ' + count
                    })
        console.log(values);
      });
    </script>
  </body>
</html>
  `;
  return html;
}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
