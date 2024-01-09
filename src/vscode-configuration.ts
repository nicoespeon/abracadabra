import * as vscode from "vscode";

export function getIgnoredFolders(): string[] {
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

export function getIgnoredPatterns(): string[] {
  const result = vscode.workspace
    .getConfiguration("abracadabra")
    .get("ignoredPatterns");

  if (!Array.isArray(result)) {
    console.log(
      `abracadabra.ignoredPatterns should be an array but current value is ${result}`
    );
    return [];
  }

  return result;
}

export function shouldShowInQuickFix(refactoringKey: string): boolean {
  const result = vscode.workspace
    .getConfiguration("abracadabra")
    .get(`${refactoringKey}.showInQuickFix`);

  return typeof result === "boolean" ? result : true;
}

export function getMaxFileLinesCount(): number {
  const result = vscode.workspace
    .getConfiguration("abracadabra")
    .get("maxFileLinesCount");

  if (typeof result !== "number") {
    console.log(
      `abracadabra.maxFileLinesCount should be a number but current value is ${result}`
    );
    return 10_000;
  }

  return Math.max(result, 1);
}

export function getMaxFileSizeKb(): number {
  const result = vscode.workspace
    .getConfiguration("abracadabra")
    .get("maxFileSizeInKb");

  if (typeof result !== "number") {
    console.log(
      `abracadabra.maxFileSizeInKb should be a number but current value is ${result}`
    );
    return 250;
  }

  return Math.max(result, 1);
}
