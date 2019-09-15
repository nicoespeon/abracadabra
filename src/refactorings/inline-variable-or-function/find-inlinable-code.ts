import { Code, Update } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as ast from "../../ast";
import { last } from "../../array-helpers";

import { findExportedIdNames } from "./find-exported-id-names";

export {
  findInlinableCode,
  InlinableCode,
  InlinableDeclarations,
  InlinableObjectPattern
};

function findInlinableCode(
  selection: Selection,
  parent: ast.Node,
  id: ast.LVal,
  init: ast.Node | null
): InlinableCode | null {
  if (!ast.isSelectableNode(init)) return null;

  if (ast.isSelectableIdentifier(id)) {
    return new InlinableIdentifier(id, parent, init.loc);
  }

  if (ast.isObjectPattern(id)) {
    if (!ast.isSelectableNode(id)) return null;

    const property = id.properties[0];
    if (ast.isRestElement(property)) return null;
    if (!ast.isSelectableNode(property)) return null;

    const child = findInlinableCode(
      selection,
      parent,
      property.value,
      property
    );
    if (!child) return null;

    const initName = getInitName(init);
    if (!initName) return null;

    return new InlinableObjectPattern(child, initName, id.loc);
  }

  return null;
}

function getInitName(init: ast.Node): string | null {
  if (ast.isIdentifier(init)) return init.name;

  if (ast.isMemberExpression(init)) {
    const { property } = init;

    const propertyName = ast.isNumericLiteral(property)
      ? `[${property.value}]`
      : ast.isStringLiteral(property)
      ? `["${property.value}"]`
      : `.${getInitName(property)}`;

    if (property.value === null && getInitName(property) === null) {
      // We can't resolve property name. Stop here.
      return null;
    }

    return `${getInitName(init.object)}${propertyName}`;
  }

  if (ast.isObjectProperty(init)) {
    return getInitName(init.key);
  }

  return null;
}

// 🎭 Component interface

interface InlinableCode {
  isRedeclared: boolean;
  isExported: boolean;
  hasIdentifiersToUpdate: boolean;
  selection: Selection;
  codeToRemoveSelection: Selection;
  updateIdentifiersWith: (inlinedCode: Code) => Update[];
}

// 🍂 Leaves

class InlinableIdentifier implements InlinableCode {
  selection: Selection;

  private id: ast.SelectableIdentifier;
  private scope: ast.Node;
  private identifiersToReplace: IdentifierToReplace[] = [];

  constructor(
    id: ast.SelectableIdentifier,
    scope: ast.Node,
    valueLoc: ast.SourceLocation
  ) {
    this.id = id;
    this.scope = scope;
    this.selection = Selection.fromAST(valueLoc);
    this.computeIdentifiersToReplace();
  }

  get isRedeclared(): boolean {
    let result = false;

    // We have to alias `this` because traversal rebinds the context of the options.
    const self = this;
    ast.traverse(this.scope, {
      enter(node) {
        if (!ast.isAssignmentExpression(node)) return;
        if (!ast.areEqual(self.id, node.left)) return;

        result = true;
      }
    });

    return result;
  }

  get isExported(): boolean {
    return findExportedIdNames(this.scope).includes(this.id.name);
  }

  get hasIdentifiersToUpdate(): boolean {
    return this.identifiersToReplace.length > 0;
  }

  get codeToRemoveSelection(): Selection {
    return this.selection
      .extendStartTo(Selection.fromAST(this.id.loc))
      .extendToStartOfLine()
      .extendToStartOfNextLine();
  }

  updateIdentifiersWith(inlinedCode: Code): Update[] {
    return this.identifiersToReplace.map(
      ({ loc, isInUnaryExpression, shorthandKey }) => ({
        code: isInUnaryExpression
          ? `(${inlinedCode})`
          : shorthandKey
          ? `${shorthandKey}: ${inlinedCode}`
          : inlinedCode,
        selection: Selection.fromAST(loc)
      })
    );
  }

  private computeIdentifiersToReplace() {
    // We have to alias `this` because traversal rebinds the context of the options.
    const self = this;
    ast.traverse(this.scope, {
      enter(node, ancestors) {
        if (!ast.isSelectableNode(node)) return;
        if (!ast.areEqual(self.id, node)) return;
        if (ast.isShadowIn(self.id, ancestors)) return;

        const selection = Selection.fromAST(node.loc);
        const isSameIdentifier = selection.isInsideNode(self.id);
        if (isSameIdentifier) return;

        const parent = last(ancestors);
        if (!parent) return;
        if (ast.isFunctionDeclaration(parent)) return;
        if (ast.isObjectProperty(parent.node) && parent.node.key === node) {
          return;
        }
        if (
          ast.isMemberExpression(parent.node) &&
          parent.node.property === node
        ) {
          return;
        }

        self.identifiersToReplace.push({
          loc: node.loc,
          isInUnaryExpression: ast.isUnaryExpression(parent.node),
          shorthandKey:
            ast.isObjectProperty(parent.node) &&
            parent.node.shorthand &&
            ast.isIdentifier(node)
              ? node.name
              : null
        });
      }
    });
  }
}

interface IdentifierToReplace {
  loc: ast.SourceLocation;
  isInUnaryExpression: boolean;
  shorthandKey: string | null;
}

// 📦 Composites

class CompositeInlinable implements InlinableCode {
  private child: InlinableCode;

  constructor(child: InlinableCode) {
    this.child = child;
  }

  get isRedeclared(): boolean {
    return this.child.isRedeclared;
  }

  get isExported(): boolean {
    return this.child.isExported;
  }

  get hasIdentifiersToUpdate(): boolean {
    return this.child.hasIdentifiersToUpdate;
  }

  get selection(): Selection {
    return this.child.selection;
  }

  get codeToRemoveSelection(): Selection {
    return this.child.codeToRemoveSelection;
  }

  updateIdentifiersWith(inlinedCode: Code): Update[] {
    return this.child.updateIdentifiersWith(inlinedCode);
  }
}

class InlinableDeclarations extends CompositeInlinable {
  private declarationsLocs: MultiDeclarationsLocs;

  constructor(
    child: InlinableCode,
    multiDeclarationsLocs: MultiDeclarationsLocs
  ) {
    super(child);
    this.declarationsLocs = multiDeclarationsLocs;
  }

  get codeToRemoveSelection(): Selection {
    const { isOtherAfterCurrent, current, other } = this.declarationsLocs;
    return isOtherAfterCurrent
      ? Selection.fromAST(current).extendEndTo(Selection.fromAST(other))
      : Selection.fromAST(current).extendStartTo(Selection.fromAST(other));
  }
}

interface MultiDeclarationsLocs {
  isOtherAfterCurrent: boolean;
  current: ast.SourceLocation;
  other: ast.SourceLocation;
}

class InlinableObjectPattern extends CompositeInlinable {
  private initName: string;
  private valueLoc: ast.SourceLocation;

  constructor(
    child: InlinableCode,
    initName: string,
    valueLoc: ast.SourceLocation
  ) {
    super(child);
    this.initName = initName;
    this.valueLoc = valueLoc;
  }

  get codeToRemoveSelection(): Selection {
    return Selection.fromAST(this.valueLoc)
      .extendToStartOfLine()
      .extendToStartOfNextLine();
  }

  updateIdentifiersWith(inlinedCode: Code): Update[] {
    return super.updateIdentifiersWith(
      this.prependObjectValueWithInitName(inlinedCode)
    );
  }

  private prependObjectValueWithInitName(code: Code): Code {
    // If destructured variable was renamed, `code` would be `userId: id`.
    // In that case, we only want to retrieve the `userId` part
    const objectValue = code.split(":")[0];

    const OBJECT_SEPARATOR = ".";
    const parts = objectValue.split(OBJECT_SEPARATOR);
    const lastPart = parts.pop();

    return [...parts, this.initName, lastPart].join(OBJECT_SEPARATOR);
  }
}
