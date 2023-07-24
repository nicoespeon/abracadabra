import { glob } from "glob";
import { suite } from "mocha";
import * as vscode from "vscode";

import { createEditorContractTests } from "../editor-contract-test";
import { RelativePath } from "../path";
import { Position } from "../position";
import { VSCodeEditor } from "./vscode-editor";

class TestableVSCodeEditor extends VSCodeEditor {
  constructor(editor: vscode.TextEditor, private workspaceUri: vscode.Uri) {
    super(editor);
  }

  /**
   * Turns out workspace can't be open from tests, so we need to fallback on
   * using glob() instead to retrieve files from the testing workspace.
   */
  protected async findFileUris(): Promise<vscode.Uri[]> {
    const files = await glob("**/*", {
      cwd: this.workspaceUri.path,
      nodir: true
    });
    return files.map((file) => this.fileUriAt(new RelativePath(file)));
  }
}

suite("VSCode Editor", () => {
  const PLAYGROUND_FOLDER_URI = vscode.Uri.file(
    `${__dirname}/vscode-editor-tests`
  );
  let editor: TestableVSCodeEditor | undefined;

  createEditorContractTests(
    async (code, position = new Position(0, 0)) => {
      vscode.workspace.fs.createDirectory(PLAYGROUND_FOLDER_URI);
      const textEditor = await openPlaygroundFileIn(PLAYGROUND_FOLDER_URI.path);
      editor = new TestableVSCodeEditor(textEditor, PLAYGROUND_FOLDER_URI);
      await editor.write(code, position);

      return editor;
    },
    async () => {
      await vscode.workspace.fs.delete(PLAYGROUND_FOLDER_URI, {
        recursive: true,
        useTrash: false
      });
    }
  );
});

async function openPlaygroundFileIn(
  folderPath: string
): Promise<vscode.TextEditor> {
  const uri = vscode.Uri.file(`${folderPath}/abracadabra-vscode-tests.ts`);
  await VSCodeEditor.ensureFileExists(uri);
  return vscode.window.showTextDocument(uri);
}
