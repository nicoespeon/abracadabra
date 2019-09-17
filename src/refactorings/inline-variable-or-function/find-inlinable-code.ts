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
  declarationSelection: DeclarationSelection,
  declaration: { id: ast.LVal; init: ast.Node | null }
): InlinableCode | null {
  const { id, init } = declaration;
  if (!ast.isSelectableNode(init)) return null;

  if (ast.isSelectableIdentifier(id)) {
    return new InlinableIdentifier(id, parent, init.loc, declarationSelection);
  }

  if (ast.isObjectPattern(id)) {
    if (!ast.isSelectableNode(id)) return null;

    let result: InlinableCode | null = null;
    id.properties.forEach(property => {
      if (!selection.isInsideNode(property)) return;
      if (ast.isRestElement(property)) return;
      if (!ast.isSelectableNode(property)) return;

      const child = findInlinableCode(selection, parent, declarationSelection, {
        id: property.value,
        init: property
      });
      if (!child) return;

      const initName = getInitName(init);
      if (!initName) return;

      result = new InlinableObjectPattern(
        child,
        initName,
        id.loc,
        declarationSelection
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
  private declarationSelection: DeclarationSelection;

  constructor(
    id: ast.SelectableIdentifier,
    scope: ast.Node,
    valueLoc: ast.SourceLocation,
    declarationSelection: DeclarationSelection
  ) {
    this.id = id;
    this.scope = scope;
    this.valueSelection = Selection.fromAST(valueLoc);
    this.declarationSelection = declarationSelection;
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
    const selection = this.valueSelection.extendStartToStartOf(
      Selection.fromAST(this.id.loc)
    );

    return this.declarationSelection.extendToDeclaration(selection);
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

class InlinableObjectPattern implements InlinableCode {
  protected child: InlinableCode;
  private initName: string;
  private valueLoc: ast.SourceLocation;
  private declarationSelection: DeclarationSelection;

  constructor(
    child: InlinableCode,
    initName: string,
    valueLoc: ast.SourceLocation,
    declarationSelection: DeclarationSelection
  ) {
    this.child = child;
    this.initName = initName;
    this.valueLoc = valueLoc;
    this.declarationSelection = declarationSelection;
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
    return this.declarationSelection.extendToDeclaration(
      Selection.fromAST(this.valueLoc)
    );
  }

  updateIdentifiersWith(inlinedCode: Code): Update[] {
    return this.child.updateIdentifiersWith(
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

interface DeclarationSelection {
  extendToDeclaration(selection: Selection): Selection;
}

class SingleDeclaration implements DeclarationSelection {
  extendToDeclaration(selection: Selection): Selection {
    return selection.extendToStartOfLine().extendToStartOfNextLine();
  }
}

class MultipleDeclarations implements DeclarationSelection {
  private previous: ast.SelectableNode;
  private next: ast.SelectableNode | undefined;

  constructor(previous: ast.SelectableNode, next?: ast.SelectableNode) {
    this.previous = previous;
    this.next = next;
  }

  extendToDeclaration(selection: Selection): Selection {
    return this.next
      ? selection.extendEndToStartOf(Selection.fromAST(this.next.loc))
      : selection.extendStartToEndOf(Selection.fromAST(this.previous.loc));
  }
}
