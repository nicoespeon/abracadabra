import { Editor } from "./editor/editor";

export { askReplacementStrategy, ReplacementStrategy };

async function askReplacementStrategy(
  otherOccurrences: any[],
  editor: Editor
): Promise<ReplacementStrategy> {
  const occurrencesCount = otherOccurrences.length;
  if (occurrencesCount <= 0) return ReplacementStrategy.SelectedOccurrence;

  const choice = await editor.askUser([
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

enum ReplacementStrategy {
  AllOccurrences,
  SelectedOccurrence,
  None
}
