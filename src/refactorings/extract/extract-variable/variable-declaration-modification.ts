import { assert } from "../../../assert";
import * as t from "../../../ast";
import { Code, Modification } from "../../../editor/editor";
import { Position } from "../../../editor/position";
import { Selection } from "../../../editor/selection";

import { Occurrence } from "./occurrence";

export class VariableDeclarationModification implements Modification {
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

export class DeclarationOnCommonAncestor extends VariableDeclarationModification {
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

    const latestDeclarationSelection = referencedDeclarationsSelections(
      this.topMostOccurrence.path
    ).sort((a, b) => (a.startsBefore(b) ? 1 : -1))[0];

    return latestDeclarationSelection
      ? Selection.cursorAtPosition(
          latestDeclarationSelection.end.putAtNextLine().putAtStartOfLine()
        )
      : Selection.cursorAtPosition(
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

export class MergeDestructuredDeclaration implements Modification {
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

function referencedDeclarationsSelections(
  path: t.NodePath<t.Node>
): Selection[] {
  const result = new Set<Selection>();

  t.traversePath(
    path.node,
    {
      Identifier(childPath) {
        t.selectableReferencesInScope(childPath)
          .filter(
            ({ parentPath }) =>
              parentPath?.isVariableDeclarator() &&
              t.isSelectablePath(parentPath.parentPath)
          )
          .map(({ parentPath }) =>
            Selection.fromAST(
              (parentPath?.parent as t.Selectable<t.VariableDeclaration>).loc
            )
          )
          .forEach((selection) => result.add(selection));
      }
    },
    path.scope
  );

  return Array.from(result);
}
