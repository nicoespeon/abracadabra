import { Editor, Code, ErrorReason, Update } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as ast from "../../ast";
import { last } from "../../array-helpers";

import { findExportedIdNames } from "./find-exported-id-names";

export { inlineVariable };

async function inlineVariable(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const inlinableCode = findInlinableCode(code, selection);

  if (!inlinableCode) {
    editor.showError(ErrorReason.DidNotFoundInlinableCode);
    return;
  }

  if (inlinableCode.isRedeclared) {
    editor.showError(ErrorReason.CantInlineRedeclaredVariables);
    return;
  }

  if (inlinableCode.isExported) {
    editor.showError(ErrorReason.CantInlineExportedVariables);
    return;
  }

  if (!inlinableCode.hasIdentifiersToUpdate) {
    editor.showError(ErrorReason.DidNotFoundInlinableCodeIdentifiers);
    return;
  }

  await editor.readThenWrite(inlinableCode.selection, inlinedCode => {
    return [
      // Replace all identifiers with inlined code
      ...inlinableCode.updateIdentifiersWith(inlinedCode),
      // Remove the variable declaration
      {
        code: "",
        selection: inlinableCode.codeToRemoveSelection
      }
    ];
  });
}

function findInlinableCode(
  code: Code,
  selection: Selection
): InlinableCode | null {
  let result: InlinableCode | null = null;

  ast.traverseAST(code, {
    enter(path) {
      const { node, parent } = path;

      // It seems variable declaration inside a named export may have no loc.
      // Use the named export loc in that situation.
      if (ast.isExportNamedDeclaration(parent) && !ast.isSelectableNode(node)) {
        node.loc = parent.loc;
      }

      if (!ast.isVariableDeclaration(node)) return;
      if (!selection.isInsideNode(node)) return;

      const declarations = node.declarations.filter(
        ast.isSelectableVariableDeclarator
      );

      if (declarations.length === 1) {
        const { id, init } = declarations[0];
        if (!ast.isSelectableNode(init)) return;
        if (!ast.isSelectableNode(id)) return;

        if (ast.isIdentifier(id)) {
          result = new InlinableIdentifier(id, parent, init.loc);
        } else if (ast.isObjectPattern(id)) {
          if (!ast.isSelectableIdentifier(init)) return;

          const property = id.properties[0];
          if (ast.isRestElement(property)) return;

          const propertyId = property.value;
          if (!ast.isSelectableIdentifier(propertyId)) return;

          const child = new InlinableIdentifier(
            propertyId,
            parent,
            propertyId.loc
          );

          result = new InlinableObjectPattern(child, init.name);
        }
        return;
      }

      declarations.forEach((declaration, index) => {
        if (!selection.isInsideNode(declaration)) return;

        const previousDeclaration = declarations[index - 1];
        const nextDeclaration = declarations[index + 1];
        if (!previousDeclaration && !nextDeclaration) return;

        // We prefer to use the next declaration by default.
        // Fallback on previous declaration when current is the last one.
        const declarationsLocs = !!nextDeclaration
          ? {
              isOtherAfterCurrent: true,
              current: declaration.loc,
              other: nextDeclaration.loc
            }
          : {
              isOtherAfterCurrent: false,
              current: declaration.loc,
              other: previousDeclaration.loc
            };

        const { id, init } = declaration;
        if (!ast.isSelectableNode(init)) return;
        if (!ast.isSelectableNode(id)) return;
        if (!ast.isIdentifier(id)) return;

        const inlinableId = new InlinableIdentifier(id, parent, init.loc);

        result = new InlinableDeclarations(inlinableId, declarationsLocs);
      });
    }
  });

  return result;
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
        if (isShadowIn(self.id, ancestors)) return;

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

function isShadowIn(
  id: ast.Identifier,
  ancestors: ast.TraversalAncestors
): boolean {
  // A variable is "shadow" if one of its ancestor redefines the Identifier.
  return ancestors.some(
    ({ node }) => isDeclaredInFunction(node) || isDeclaredInScope(node)
  );

  function isDeclaredInFunction(node: ast.Node): boolean {
    return (
      ast.isFunctionDeclaration(node) &&
      node.params.some(node => ast.areEqual(id, node))
    );
  }

  function isDeclaredInScope(node: ast.Node): boolean {
    return (
      ast.isBlockStatement(node) &&
      node.body.some(
        child =>
          ast.isVariableDeclaration(child) &&
          child.declarations.some(
            declaration =>
              ast.isVariableDeclarator(declaration) &&
              ast.areEqual(id, declaration.id) &&
              // Of course, if it's the inlined variable it's not a shadow!
              declaration.id !== id
          )
      )
    );
  }
}

// 📦 Composites

class InlinableDeclarations implements InlinableCode {
  private child: InlinableCode;
  private declarationsLocs: MultiDeclarationsLocs;

  constructor(
    child: InlinableCode,
    multiDeclarationsLocs: MultiDeclarationsLocs
  ) {
    this.child = child;
    this.declarationsLocs = multiDeclarationsLocs;
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
    const { isOtherAfterCurrent, current, other } = this.declarationsLocs;
    return isOtherAfterCurrent
      ? Selection.fromAST(current).extendEndTo(Selection.fromAST(other))
      : Selection.fromAST(current).extendStartTo(Selection.fromAST(other));
  }

  updateIdentifiersWith(inlinedCode: Code): Update[] {
    return this.child.updateIdentifiersWith(inlinedCode);
  }
}

interface MultiDeclarationsLocs {
  isOtherAfterCurrent: boolean;
  current: ast.SourceLocation;
  other: ast.SourceLocation;
}

class InlinableObjectPattern implements InlinableCode {
  private child: InlinableCode;
  private initName: string;

  constructor(child: InlinableCode, initName: string) {
    this.child = child;
    this.initName = initName;
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
    return this.child.updateIdentifiersWith(inlinedCode).map(update => ({
      ...update,
      code: this.prependObjectValueWithInitName(update.code)
    }));
  }

  private prependObjectValueWithInitName(code: Code): Code {
    const separator = ": ";
    const [key, value] = code.split(separator);

    return [key, separator, this.initName, ".", value].join("");
  }
}
