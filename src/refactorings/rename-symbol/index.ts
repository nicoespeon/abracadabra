import * as vscode from "vscode";

import { executeSafely } from "../../commands";
import { VSCodeEditor } from "../../editor/adapters/vscode-editor";

import { renameSymbol } from "./rename-symbol";

import { Refactoring } from "../../types";

const config: Refactoring = {
  command: {
    key: "renameSymbol",
    async operation() {
      const activeTextEditor = vscode.window.activeTextEditor;
      if (!activeTextEditor) {
        return;
      }

      await executeSafely(() =>
        renameSymbol(new VSCodeEditor(activeTextEditor))
      );
    }
  }
};

export default config;
