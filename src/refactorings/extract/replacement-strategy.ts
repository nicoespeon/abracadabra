import { Editor } from "../../editor/editor";

export async function askReplacementStrategy(
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

export type ReplacementStrategy =
  | "all occurrences"
  | "selected occurrence"
  | "none";
