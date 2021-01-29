import { Code, Modification } from "../../../editor/editor";
import { Selection } from "../../../editor/selection";
import { Position } from "../../../editor/position";
import * as t from "../../../ast";

import { Occurrence } from "./occurrence";

export { VariableDeclarationModification };

class VariableDeclarationModification implements Modification {
  constructor(
    private name: string,
    private value: string,
    private useTabs: boolean,
    private allOccurrences: Occurrence[]
  ) {}

  get code(): Code {
    const indentationLevel = this.selection.start.character;
    const indentationChar = this.useTabs ? "\t" : " ";
    const indentation = indentationChar.repeat(indentationLevel);

    return `const ${this.name} = ${this.value};\n${indentation}`;
  }

  get selection(): Selection {
    const topMostOccurrence = this.allOccurrences.sort(topToBottom)[0];
    let cursorOnCommonAncestor = Selection.cursorAtPosition(
      topMostOccurrence.parentScopePosition
    );

    if (this.allOccurrences.length > 1) {
      const commonAncestor = t.findCommonAncestorToDeclareVariable(
        topMostOccurrence.path,
        this.allOccurrences.map((occurrence) => occurrence.path)
      );

      if (commonAncestor) {
        cursorOnCommonAncestor = Selection.cursorAtPosition(
          Position.fromAST(commonAncestor.node.loc.start)
        );
      }
    }

    return cursorOnCommonAncestor;
  }
}

function topToBottom(a: Occurrence, b: Occurrence): number {
  return a.selection.startsBefore(b.selection) ? -1 : 1;
}
