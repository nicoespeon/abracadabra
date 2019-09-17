import { Code, Update } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as ast from "../../ast";
import { last } from "../../array-helpers";

import { findExportedIdNames } from "./find-exported-id-names";

export {
  findInlinableCode,
  InlinableCode,
  InlinableObjectPattern,
  SingleDeclaration,
  MultipleDeclarations
};

function findInlinableCode(
  selection: Selection,
  parent: ast.Node,
  declaration: { id: ast.LVal; init: ast.Node | null }
): InlinableCode | null {
  const { id, init } = declaration;
  if (!ast.isSelectableNode(init)) return null;

  if (ast.isSelectableIdentifier(id)) {
    return new InlinableIdentifier(id, parent, init.loc);
  }

  if (ast.isObjectPattern(id)) {
    if (!ast.isSelectableNode(id)) return null;

    let result: InlinableCode | null = null;
    id.properties.forEach((property, index) => {
      if (!selection.isInsideNode(property)) return;
      if (ast.isRestElement(property)) return;
      if (!ast.isSelectableNode(property)) return;

      const child = findInlinableCode(selection, parent, {
        id: property.value,
        init: property
      });
      if (!child) return;

      const initName = getInitName(init);
      if (!initName) return;

      const previous = id.properties[index - 1];
      const next = id.properties[index + 1];

      result = new InlinableObjectPattern(
        child,
        initName,
        id.loc,
        previous,
        next
      );
    });

    return result;
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
  valueSelection: Selection;
  codeToRemoveSelection: Selection;
  updateIdentifiersWith: (inlinedCode: Code) => Update[];
}

// 🍂 Leaves

class InlinableIdentifier implements InlinableCode {
  valueSelection: Selection;

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
    this.valueSelection = Selection.fromAST(valueLoc);
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
    return this.valueSelection.extendStartToStartOf(
      Selection.fromAST(this.id.loc)
    );
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
  protected child: InlinableCode;

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

  get valueSelection(): Selection {
    return this.child.valueSelection;
  }

  get codeToRemoveSelection(): Selection {
    return this.child.codeToRemoveSelection;
  }

  updateIdentifiersWith(inlinedCode: Code): Update[] {
    return this.child.updateIdentifiersWith(inlinedCode);
  }
}
class SingleDeclaration extends CompositeInlinable {
  get codeToRemoveSelection(): Selection {
    return super.codeToRemoveSelection
      .extendToStartOfLine()
      .extendToStartOfNextLine();
  }
}

class MultipleDeclarations extends CompositeInlinable {
  private previous: ast.SelectableNode;
  private next: ast.SelectableNode | undefined;

  constructor(
    child: InlinableCode,
    previous: ast.SelectableNode,
    next?: ast.SelectableNode
  ) {
    super(child);
    this.previous = previous;
    this.next = next;
  }

  get codeToRemoveSelection(): Selection {
    const selection = super.codeToRemoveSelection;

    return this.next
      ? selection.extendEndToStartOf(Selection.fromAST(this.next.loc))
      : selection.extendStartToEndOf(Selection.fromAST(this.previous.loc));
  }
}

class InlinableObjectPattern extends CompositeInlinable {
  private initName: string;
  private valueLoc: ast.SourceLocation;
  private previous: ast.SelectableObjectProperty | undefined;
  private next: ast.SelectableObjectProperty | undefined;

  constructor(
    child: InlinableCode,
    initName: string,
    valueLoc: ast.SourceLocation,
    previous?: ast.Node | null,
    next?: ast.Node | null
  ) {
    super(child);
    this.initName = initName;
    this.valueLoc = valueLoc;

    if (previous && ast.isSelectableObjectProperty(previous)) {
      this.previous = previous;
    }

    if (next && ast.isSelectableObjectProperty(next)) {
      this.next = next;
    }
  }

  get codeToRemoveSelection(): Selection {
    const selection = Selection.fromAST(this.valueLoc);
    return selection;

    if (this.next) {
      return selection.extendEndToStartOf(Selection.fromAST(this.next.loc));
    }

    if (this.previous) {
      return selection.extendStartToEndOf(Selection.fromAST(this.previous.loc));
    }

    return super.codeToRemoveSelection;
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
