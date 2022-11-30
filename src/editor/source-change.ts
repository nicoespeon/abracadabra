import { Selection } from "./selection";

export interface SourceChange {
  readonly selection: Selection;
  applyToSelection(selection: Selection): Selection;
  modifies(selection: Selection): boolean;
}

export class DeleteSourceChange implements SourceChange {
  constructor(readonly selection: Selection) {}

  applyToSelection(selection: Selection): Selection {
    const { start, end, height } = this.selection;

    if (selection.end.isStrictlyBefore(start)) return selection;

    if (end.isStrictlyBefore(selection.start)) {
      const deletedOnSameLine = end.isSameLineThan(selection.start);
      return Selection.fromPositions(
        selection.start
          .removeLines(height)
          .removeCharacters(deletedOnSameLine ? end.character : 0),
        selection.end
          .removeLines(height)
          .removeCharacters(
            deletedOnSameLine && selection.isOneLine ? end.character : 0
          )
      );
    }

    return selection;
  }

  modifies(selection: Selection): boolean {
    return this.selection.isInside(selection);
  }
}

export class UpdateSourceChange implements SourceChange {
  constructor(readonly selection: Selection, private textLength: number) {}

  applyToSelection(selection: Selection): Selection {
    const { start, end, height } = this.selection;

    if (selection.end.isStrictlyBefore(start)) return selection;

    if (end.isStrictlyBefore(selection.start)) {
      const updateOnSameLine = end.isSameLineThan(selection.start);
      return Selection.fromPositions(
        selection.start
          .addLines(height)
          .addCharacters(updateOnSameLine ? this.textLength : 0),
        selection.end
          .addLines(height)
          .addCharacters(
            updateOnSameLine && selection.isOneLine ? this.textLength : 0
          )
      );
    }

    return selection;
  }

  modifies(selection: Selection): boolean {
    return this.selection.isInside(selection);
  }
}
