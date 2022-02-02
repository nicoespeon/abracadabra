import { Editor } from "../../editor/editor";

export { askReplacementStrategy };

async function askReplacementStrategy(
  otherOccurrences: any[],
  editor: Editor
): Promise<ReplacementStrategy> {
  const occurrencesCount = otherOccurrences.length;
  if (occurrencesCount <= 0) return ReplacementStrategy.SelectedOccurrence;

  const choice = await editor.askUserChoice([
    {
      value: ReplacementStrategy.AllOccurrences,
      label: `Replace all ${occurrencesCount + 1} occurrences`
    },
    {
      value: ReplacementStrategy.SelectedOccurrence,
      label: "Replace this occurrence only"
    }
  ]);

  return choice ? choice.value : ReplacementStrategy.None;
}

export enum ReplacementStrategy {
  AllOccurrences,
  SelectedOccurrence,
  None
}
