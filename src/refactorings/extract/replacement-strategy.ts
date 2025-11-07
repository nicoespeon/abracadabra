import {
  COMMANDS,
  EditorCommand,
  RefactoringState,
  getUserChoice
} from "../../refactorings";

export function askReplacementStrategy(
  otherOccurrences: unknown[],
  state: RefactoringState,
  callback: (strategy: ReplacementStrategy) => EditorCommand
) {
  const occurrencesCount = otherOccurrences.length;
  if (occurrencesCount <= 0) {
    return callback("selected occurrence" as const);
  }

  if (state.state === "with user responses") {
    const choice = getUserChoice<ReplacementStrategy>(state);
    const strategy = isReplacementStrategy(choice?.value)
      ? choice.value
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
