import { Editor } from "../../editor/editor";
import { COMMANDS, EditorCommand, RefactoringState } from "../../refactorings";

export function askReplacementStrategy(
  otherOccurrences: unknown[],
  state: RefactoringState,
  callback: (strategy: ReplacementStrategy) => EditorCommand
) {
  const occurrencesCount = otherOccurrences.length;
  if (occurrencesCount <= 0) {
    return callback("selected occurrence" as const);
  }

  if (state.state === "user choice response") {
    const strategy = isReplacementStrategy(state.choice?.value)
      ? state.choice.value
      : "none";
    return callback(strategy);
  }

  return COMMANDS.askUserChoice([
    {
      value: "all occurrences" as const,
      label: `Replace all ${occurrencesCount + 1} occurrences`
    },
    {
      value: "selected occurrence" as const,
      label: "Replace this occurrence only"
    }
  ]);
}
export async function askReplacementStrategy__OLD(
  otherOccurrences: any[],
  editor: Editor
): Promise<ReplacementStrategy> {
  const occurrencesCount = otherOccurrences.length;
  if (occurrencesCount <= 0) return "selected occurrence";

  const choice = await editor.askUserChoice([
    {
      value: "all occurrences" as const,
      label: `Replace all ${occurrencesCount + 1} occurrences`
    },
    {
      value: "selected occurrence" as const,
      label: "Replace this occurrence only"
    }
  ]);

  return choice ? choice.value : "none";
}

const replacementStrategies = [
  "all occurrences",
  "selected occurrence",
  "none"
] as const;

export type ReplacementStrategy = (typeof replacementStrategies)[number];

export function isReplacementStrategy(
  value: any
): value is ReplacementStrategy {
  return replacementStrategies.includes(value);
}
