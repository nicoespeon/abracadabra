---
to: "<%= hasActionProvider ? 'src/refactorings/' + h.changeCase.param(name) + '/action-provider.ts' : null %>"
---
<%
  camelName = h.changeCase.camel(name)
  pascalName = h.changeCase.pascalCase(name)
  dashedName = h.changeCase.param(name)
  titleName = h.changeCase.titleCase(name)
  sentenceName = h.changeCase.sentenceCase(name)
-%>
import * as vscode from "vscode";

import {
  CodeActionProvider,
  createActionProviderFor
} from "../../action-providers";
import { createSelectionFromVSCode } from "../../editor/adapters/write-code-in-vscode";

import { commandKey } from "./command";
import { <%= actionProviderName %> } from "./<%= dashedName %>";

class <%= pascalName %>ActionProvider implements CodeActionProvider {
  public readonly kind = vscode.CodeActionKind.RefactorRewrite;

  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const code = document.getText();
    const selection = createSelectionFromVSCode(range);

    if (!<%= actionProviderName %>(code, selection)) return;

    const action = new vscode.CodeAction("✨ <%= sentenceName %>", this.kind);
    action.isPreferred = true;
    action.command = {
      command: commandKey,
      title: "<%= titleName %>"
    };

    return [action];
  }
}

export default createActionProviderFor(new <%= pascalName %>ActionProvider());
