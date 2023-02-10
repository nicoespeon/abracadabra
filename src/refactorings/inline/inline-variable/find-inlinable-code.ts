import { last } from "../../../array";
import * as t from "../../../ast";
import { VariableDeclarator } from "../../../ast";
import { Code, Modification } from "../../../editor/editor";
import { Position } from "../../../editor/position";
import { Selection } from "../../../editor/selection";
import { findExportedIdNames } from "../find-exported-id-names";

export function findInlinableCode(
  selection: Selection,
  parent: t.Node,
  declaration: Declaration | VariableDeclarator
): InlinableCode | null {
  const { id, init } = declaration;
  if (!init) return null;
  if (!t.isSelectableNode(init)) return null;

  if (isSelectableIdentifierDeclaration(declaration)) {
    return t.isJSXElement(init)
      ? new InlinableJSXElementIdentifier(declaration, parent)
      : new InlinableIdentifier(declaration, parent);
  }

  if (t.isObjectPattern(id)) {
    if (!t.isSelectableNode(id)) return null;

    let result: InlinableCode | null = null;
    id.properties.forEach((property, index) => {
      if (!selection.isInsideNode(property)) return;
      if (t.isRestElement(property)) return;
      if (!t.isSelectableObjectProperty(property)) return;

      const child = findInlinableCode(selection, parent, {
        id: property.value,
        init: property,
        loc: parent.loc ?? null
      });
      if (!child) return;

      const initName = getInitName(init);
      if (!initName) return;

      const previous = id.properties[index - 1];
      const next = id.properties[index + 1];
      const hasRestSibling = id.properties.some((p) => t.isRestElement(p));

      result = new InlinableObjectPattern(
        child,
        initName,
        property,
        hasRestSibling,
        previous,
        next
      );
    });

    return wrapInTopLevelPattern(result, declaration, id.loc);
  }

  if (t.isArrayPattern(id)) {
    if (!t.isSelectableNode(id)) return null;

    let result: InlinableCode | null = null;
    id.elements.forEach((element, index) => {
      if (!element) return;
      if (!selection.isInsideNode(element)) return;
      if (!t.isSelectableNode(element)) return;

      const child = findInlinableCode(selection, parent, {
        id: element,
        init,
        loc: parent.loc ?? null
      });
      if (!child) return;

      const previous = id.elements[index - 1];
      const next = id.elements[index + 1];

      result = new InlinableArrayPattern(child, index, element, previous, next);
    });

    return wrapInTopLevelPattern(result, declaration, id.loc);
  }

  return null;
}

function getInitName(init: t.Node): string | null {
  if (t.isIdentifier(init)) return init.name;

  if (t.isMemberExpression(init)) {
    const propertyName = getPropertyName(init);
    if (!propertyName) return null;

    return `${getInitName(init.object)}${propertyName}`;
  }

  if (t.isObjectProperty(init)) {
    return getInitName(init.key);
  }

  if (t.isThisExpression(init)) {
    return "this";
  }

  return null;
}

function getPropertyName(init: t.MemberExpression): string | null {
  const { property, computed } = init;

  if (t.isNumericLiteral(property)) {
    return `[${property.value}]`;
  }

  if (t.isStringLiteral(property)) {
    return `["${property.value}"]`;
  }

  if (t.isIdentifier(property)) {
    return computed ? `[${property.name}]` : `.${property.name}`;
  }

  if (t.isCallExpression(property) && t.isIdentifier(property.callee)) {
    return computed
      ? `[${property.callee.name}()]`
      : `.${property.callee.name}()`;
  }

  return `.${getInitName(property)}`;
}

function wrapInTopLevelPattern(
  child: InlinableCode | null,
  declaration: Declaration | VariableDeclarator,
  loc: t.SourceLocation
): InlinableCode | null {
  if (!child) return child;

  const isTopLevelObjectPattern = t.isVariableDeclarator(declaration);

  return isTopLevelObjectPattern
    ? new InlinableTopLevelPattern(child, loc)
    : child;
}

type Declaration = {
  id: t.Node;
  init: t.Node | null;
  loc: t.SourceLocation | null;
};
type SelectableIdentifierDeclaration = {
  id: t.SelectableIdentifier;
  init: t.SelectableNode;
  loc: t.SourceLocation;
};

function isSelectableIdentifierDeclaration(
  declaration: Declaration | VariableDeclarator
): declaration is SelectableIdentifierDeclaration {
  return (
    t.isSelectableIdentifier(declaration.id) &&
    !!declaration.init &&
    t.isSelectableNode(declaration.init) &&
    !!declaration.loc
  );
}

// 🎭 Component interface

export interface InlinableCode {
  isRedeclared: boolean;
  isExported: boolean;
  hasIdentifiersToUpdate: boolean;
  shouldExtendSelectionToDeclaration: boolean;
  valueSelection: Selection;
  codeToRemoveSelection: Selection;
  updateIdentifiersWith: (inlinedCode: Code) => Modification[];
}

// 🍂 Leaves

class InlinableIdentifier implements InlinableCode {
  public readonly shouldExtendSelectionToDeclaration = true;

  protected identifiersToReplace: IdentifierToReplace[] = [];

  constructor(
    protected declaration: SelectableIdentifierDeclaration,
    private scope: t.Node
  ) {
    this.computeIdentifiersToReplace();
  }

  get id(): t.SelectableIdentifier {
    return this.declaration.id;
  }

  get init(): t.SelectableNode {
    return this.declaration.init;
  }

  get valueSelection(): Selection {
    return Selection.fromAST(this.init.loc);
  }

  get isRedeclared(): boolean {
    let result = false;

    // We have to alias `this` because traversal rebinds the context of the options.
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    t.traverseNode(this.scope, {
      enter(node) {
        if (!t.isAssignmentExpression(node)) return;
        if (!t.areEquivalent(self.id, node.left)) return;

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
    return Selection.fromAST(this.declaration.loc);
  }

  updateIdentifiersWith(inlinedCode: Code): Modification[] {
    return this.identifiersToReplace.map(
      ({ loc, shouldWrapInParenthesis, shorthandKey, parent }) => {
        let code = shouldWrapInParenthesis
          ? `(${inlinedCode})`
          : shorthandKey
          ? `${shorthandKey}: ${inlinedCode}`
          : inlinedCode;
        let selection = Selection.fromAST(loc);

        if (t.isTemplateLiteral(parent) && t.isLiteral(this.init)) {
          code = code.replace(/^("|'|`)/, "").replace(/("|'|`)$/, "");
          selection = Selection.fromPositions(
            // Remove the leading `${`
            Position.fromAST(loc.start).removeCharacters(2),
            // Remove the trailing `}`
            Position.fromAST(loc.end).addCharacters(1)
          );
        }

        return {
          code,
          selection
        };
      }
    );
  }

  private computeIdentifiersToReplace() {
    // We have to alias `this` because traversal rebinds the context of the options.
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    t.traverseNode(this.scope, {
      enter(node, ancestors) {
        if (!t.isSelectableNode(node)) return;
        if (!t.areEquivalent(self.id, node)) return;
        if (t.isShadowIn(self.id, ancestors)) return;

        const selection = Selection.fromAST(node.loc);
        const isSameIdentifier = selection.isInsideNode(self.id);
        if (isSameIdentifier) return;

        const parent = last(ancestors);
        if (!parent) return;
        if (t.isFunctionDeclaration(parent)) return;
        if (
          t.isObjectProperty(parent.node) &&
          parent.node.key === node &&
          !parent.node.computed
        ) {
          return;
        }
        if (
          t.isMemberExpression(parent.node) &&
          parent.node.property === node
        ) {
          return;
        }

        const parentHasParenthesis =
          t.isCallExpression(parent.node) || t.isIfStatement(parent.node);

        self.identifiersToReplace.push({
          loc: node.loc,
          parent: parent.node,
          grandParent: ancestors[ancestors.length - 2]?.node ?? null,
          shouldWrapInParenthesis:
            t.isUnaryExpression(parent.node) ||
            (t.isTSAsExpression(self.init) && !parentHasParenthesis) ||
            (t.isFunction(self.init) && Boolean(self.init.async)),
          shorthandKey:
            t.isObjectProperty(parent.node) &&
            parent.node.shorthand &&
            t.isIdentifier(node)
              ? node.name
              : null
        });
      }
    });
  }
}

class InlinableJSXElementIdentifier extends InlinableIdentifier {
  updateIdentifiersWith(inlinedCode: Code): Modification[] {
    return this.identifiersToReplace.map(
      ({
        parent,
        grandParent,
        loc,
        shouldWrapInParenthesis,
        shorthandKey
      }) => ({
        code: shouldWrapInParenthesis
          ? `(${inlinedCode})`
          : shorthandKey
          ? `${shorthandKey}: ${inlinedCode}`
          : inlinedCode,
        selection:
          t.isJSXExpressionContainer(parent) &&
          !t.isJSXAttribute(grandParent) &&
          t.isSelectableNode(parent)
            ? Selection.fromAST(parent.loc)
            : Selection.fromAST(loc)
      })
    );
  }
}

export class InlinableTSTypeAlias implements InlinableCode {
  shouldExtendSelectionToDeclaration = true;
  codeToRemoveSelection: Selection;
  valueSelection: Selection;

  // Type aliases can't be redeclared.
  isRedeclared = false;

  private path: t.SelectablePath<t.TSTypeAliasDeclaration>;
  private refToReplaceLocs: t.SourceLocation[] = [];

  constructor(
    path: t.SelectablePath<t.TSTypeAliasDeclaration>,
    valueLoc: t.SourceLocation
  ) {
    this.path = path;
    this.codeToRemoveSelection = Selection.fromAST(path.node.loc);
    this.valueSelection = Selection.fromAST(valueLoc);
    this.computeIdentifiersToReplace();
  }

  get isExported(): boolean {
    return findExportedIdNames(this.path.parent).includes(
      this.path.node.id.name
    );
  }

  get hasIdentifiersToUpdate(): boolean {
    return this.refToReplaceLocs.length > 0;
  }

  updateIdentifiersWith(inlinedCode: Code): Modification[] {
    return this.refToReplaceLocs.map((loc) => ({
      code: inlinedCode,
      selection: Selection.fromAST(loc)
    }));
  }

  private computeIdentifiersToReplace() {
    // Alias `this` because traversal rebinds the context of the options.
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    this.path.parentPath.traverse({
      TSTypeReference(path) {
        if (!t.isSelectablePath(path)) return;
        if (!t.areEquivalent(self.path.node.id, path.node.typeName)) return;

        self.refToReplaceLocs.push(path.node.loc);
      }
    });
  }
}

interface IdentifierToReplace {
  loc: t.SourceLocation;
  shouldWrapInParenthesis: boolean;
  shorthandKey: string | null;
  parent: t.Node;
  grandParent: t.Node | null;
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

  get shouldExtendSelectionToDeclaration(): boolean {
    return this.child.shouldExtendSelectionToDeclaration;
  }

  get valueSelection(): Selection {
    return this.child.valueSelection;
  }

  get codeToRemoveSelection(): Selection {
    return this.child.codeToRemoveSelection;
  }

  updateIdentifiersWith(inlinedCode: Code): Modification[] {
    return this.child.updateIdentifiersWith(inlinedCode);
  }
}
export class SingleDeclaration extends CompositeInlinable {
  get codeToRemoveSelection(): Selection {
    const selection = super.codeToRemoveSelection;

    if (!super.shouldExtendSelectionToDeclaration) {
      return selection;
    }

    return selection.extendToStartOfLine().extendToStartOfNextLine();
  }
}

export class MultipleDeclarations extends CompositeInlinable {
  private previous: t.SelectableNode;
  private next: t.SelectableNode | undefined;

  constructor(
    child: InlinableCode,
    previous: t.SelectableNode,
    next?: t.SelectableNode
  ) {
    super(child);
    this.previous = previous;
    this.next = next;
  }

  get codeToRemoveSelection(): Selection {
    const selection = super.codeToRemoveSelection;

    if (!super.shouldExtendSelectionToDeclaration) {
      return selection;
    }

    return this.next
      ? selection.extendEndToStartOf(Selection.fromAST(this.next.loc))
      : selection.extendStartToEndOf(Selection.fromAST(this.previous.loc));
  }
}

export class InlinableObjectPattern extends CompositeInlinable {
  private initName: string;
  private property: t.SelectableObjectProperty;
  private previous: t.SelectableObjectProperty | undefined;
  private next: t.SelectableObjectProperty | undefined;
  private hasRestSibling: boolean;

  constructor(
    child: InlinableCode,
    initName: string,
    property: t.SelectableObjectProperty,
    hasRestSibling: boolean,
    previous?: t.Node | null,
    next?: t.Node | null
  ) {
    super(child);
    this.initName = initName;
    this.property = property;
    this.hasRestSibling = hasRestSibling;

    if (previous && t.isSelectableObjectProperty(previous)) {
      this.previous = previous;
    }

    if (next && t.isSelectableObjectProperty(next)) {
      this.next = next;
    }
  }

  get shouldExtendSelectionToDeclaration(): boolean {
    if (!super.shouldExtendSelectionToDeclaration) return false;

    if (this.hasRestSibling) {
      return false;
    }

    return !this.next && !this.previous;
  }

  get codeToRemoveSelection(): Selection {
    if (!super.shouldExtendSelectionToDeclaration) {
      return super.codeToRemoveSelection;
    }

    if (this.hasRestSibling) {
      const valueSelection = Selection.fromAST(this.property.value.loc);
      const keySelection = Selection.fromAST(this.property.key.loc);
      const NO_SELECTION = Selection.cursorAt(0, 0);

      return t.isObjectPattern(this.property.value)
        ? valueSelection.extendStartToEndOf(keySelection)
        : NO_SELECTION;
    }

    const selection = Selection.fromAST(this.property.loc);

    if (this.next) {
      return selection.extendEndToStartOf(Selection.fromAST(this.next.loc));
    }

    if (this.previous) {
      return selection.extendStartToEndOf(Selection.fromAST(this.previous.loc));
    }

    return selection;
  }

  updateIdentifiersWith(inlinedCode: Code): Modification[] {
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

class InlinableArrayPattern extends CompositeInlinable {
  private index: number;
  private element: t.SelectableNode;
  private previous: t.SelectableNode | undefined;
  private next: t.SelectableNode | undefined;

  constructor(
    child: InlinableCode,
    index: number,
    element: t.SelectableNode,
    previous?: t.Node | null,
    next?: t.Node | null
  ) {
    super(child);
    this.index = index;
    this.element = element;

    if (previous && t.isSelectableNode(previous)) {
      this.previous = previous;
    }

    if (next && t.isSelectableNode(next)) {
      this.next = next;
    }
  }

  get shouldExtendSelectionToDeclaration(): boolean {
    if (!super.shouldExtendSelectionToDeclaration) return false;

    return !this.next && !this.previous;
  }

  get codeToRemoveSelection(): Selection {
    if (!super.shouldExtendSelectionToDeclaration) {
      return super.codeToRemoveSelection;
    }

    const selection = Selection.fromAST(this.element.loc);

    if (this.previous && !this.next) {
      return selection.extendStartToEndOf(Selection.fromAST(this.previous.loc));
    }

    return selection;
  }

  updateIdentifiersWith(inlinedCode: Code): Modification[] {
    return super.updateIdentifiersWith(`${inlinedCode}[${this.index}]`);
  }
}

class InlinableTopLevelPattern extends CompositeInlinable {
  private loc: t.SourceLocation;

  constructor(child: InlinableCode, loc: t.SourceLocation) {
    super(child);
    this.loc = loc;
  }

  get codeToRemoveSelection(): Selection {
    return super.shouldExtendSelectionToDeclaration
      ? Selection.fromAST(this.loc)
      : super.codeToRemoveSelection;
  }
}
