---
to: src/refactorings/<%= h.changeCase.param(name) %>/command.ts
---
<%
  camelName = h.changeCase.camel(name)
  dashedName = h.changeCase.param(name)
-%>
import * as vscode from "vscode";

import { createCommand } from "../../commands";
import { <%= camelName %> } from "./<%= dashedName %>";

// Must match `command` field in `package.json`
export const commandKey = "abracadabra.<%= camelName %>";

export default vscode.commands.registerCommand(
  commandKey,
  createCommand(<%= camelName %>)
);



