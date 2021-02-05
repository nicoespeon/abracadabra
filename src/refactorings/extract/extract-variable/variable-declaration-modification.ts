import { Code, Modification } from "../../../editor/editor";
import { Selection } from "../../../editor/selection";
import { Position } from "../../../editor/position";
import * as t from "../../../ast";
import { assert } from "../../../assert";

import { Occurrence } from "./occurrence";

export {
  VariableDeclarationModification,
  DeclarationOnCommonAncestor,
  MergeDestructuredDeclaration
};

class VariableDeclarationModification implements Modification {
  constructor(
    private name: string,
    private value: string,
    private useTabs: boolean,
    private _selection: Selection
  ) {}

  get code(): Code {
    const indentationLevel = this.selection.start.character;
    const indentationChar = this.useTabs ? "\t" : " ";
    const indentation = indentationChar.repeat(indentationLevel);

    return `const ${this.name} = ${this.value};\n${indentation}`;
  }

  get selection(): Selection {
    return this._selection;
  }
}

class DeclarationOnCommonAncestor extends VariableDeclarationModification {
  constructor(
    name: string,
    value: string,
    useTabs: boolean,
    private allOccurrences: Occurrence[]
  ) {
    super(name, value, useTabs, Selection.cursorAt(0, 0));
    assert(
      allOccurrences.length > 0,
      "Can't find common ancestor without occurrence"
    );
  }

  get selection(): Selection {
    const commonAncestor = t.findCommonAncestorToDeclareVariable(
      this.topMostOccurrence.path,
      this.allOccurrences.map((occurrence) => occurrence.path)
    );

    if (!commonAncestor) {
      return Selection.cursorAtPosition(
        this.topMostOccurrence.parentScopePosition
      );
    }

    return Selection.cursorAtPosition(
      Position.fromAST(commonAncestor.node.loc.start)
    );
  }

  private get topMostOccurrence(): Occurrence {
    return this.allOccurrences.sort(topToBottom)[0];
  }
}

function topToBottom(a: Occurrence, b: Occurrence): number {
  return a.selection.startsBefore(b.selection) ? -1 : 1;
}

class MergeDestructuredDeclaration implements Modification {
  constructor(
    private name: string,
    private lastDestructuredProperty: t.SelectableNode
  ) {}

  get code(): Code {
    return `, ${this.name}`;
  }

  get selection(): Selection {
    return Selection.cursorAtPosition(
      Position.fromAST(this.lastDestructuredProperty.loc.end)
    );
  }
}
