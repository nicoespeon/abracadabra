import * as vscode from "vscode";

export { getIgnoredFolders, shouldShowInQuickFix };

function getIgnoredFolders(): string[] {
  const result = vscode.workspace
    .getConfiguration("abracadabra")
    .get("ignoredFolders");

  if (!Array.isArray(result)) {
    console.log(
      `abracadabra.ignoredFolders should be an array but current value is ${result}`
    );
    return [];
  }

  return result;
}

function shouldShowInQuickFix(refactoringKey: string): boolean {
  const result = vscode.workspace
    .getConfiguration("abracadabra")
    .get(`${refactoringKey}.showInQuickFix`);

  return typeof result === "boolean" ? result : true;
}
