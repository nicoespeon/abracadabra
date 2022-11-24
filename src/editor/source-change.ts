import { Selection } from "./selection";

export interface SourceChange {
  readonly selection: Selection;
  applyToSelection(selection: Selection): Selection;
}

export class DeleteSourceChange implements SourceChange {
  constructor(readonly selection: Selection) {}

  applyToSelection(selection: Selection): Selection {
    return selection;
    // TODO: re-implement, driven with tests
    // const remainingSelections = selection.exclude(this.selection);

    // if (remainingSelections.length === 0) {
    //   return Selection.fromPositions(selection.start, selection.start);
    // }

    // if (remainingSelections.length === 1) {
    //   return remainingSelections[0];
    // }

    // const [first, second] = remainingSelections;
    // const newEnd = second.isMultiLines
    //   ? new Position(
    //       first.end.line + second.end.line - second.start.line,
    //       second.end.character
    //     )
    //   : new Position(
    //       first.end.line,
    //       first.end.character + second.end.character
    //     );
    // return Selection.fromPositions(first.start, newEnd);
  }
}

export class UpdateSourceChange implements SourceChange {
  constructor(readonly selection: Selection, private textLength: number) {}

  applyToSelection(selection: Selection): Selection {
    if (selection.end.isBefore(this.selection.start)) return selection;
    if (this.selection.end.isBefore(selection.start)) {
      return Selection.fromPositions(
        selection.start.addCharacters(this.textLength),
        selection.end.addCharacters(this.textLength)
      );
    }

    return selection;
    // TODO: re-implement, driven with tests
    // const remainingSelections = selection.exclude(this.selection);
    // const start = remainingSelections[0]?.start ?? selection.start;

    // return Selection.fromPositions(start, start.addCharacters(this.textLength));
  }
}
