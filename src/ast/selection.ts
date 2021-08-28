import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

export {
  ASTSelection,
  ASTPosition,
  SelectablePath,
  SelectableNode,
  SelectableObjectProperty,
  SelectableIdentifier,
  SelectableVariableDeclarator,
  Selectable,
  isSelectablePath,
  isSelectableNode,
  isSelectableVariableDeclarator,
  isSelectableIdentifier,
  isSelectableObjectProperty
};

interface ASTSelection {
  start: ASTPosition;
  end: ASTPosition;
}

interface ASTPosition {
  line: number;
  column: number;
}

type SelectablePath<T = t.Node> = NodePath<T> & { node: Selectable<T> };
type SelectableNode = Selectable<t.Node>;
type SelectableIdentifier = Selectable<t.Identifier>;
type SelectableVariableDeclarator = Selectable<t.VariableDeclarator>;
type Selectable<T> = T & { loc: t.SourceLocation };

interface SelectableObjectProperty extends t.ObjectProperty {
  loc: t.SourceLocation;
  key: Selectable<t.ObjectProperty["key"]>;
  value: Selectable<t.ObjectProperty["value"]>;
}

function isSelectablePath<T extends t.Node>(
  path: NodePath<T>
): path is SelectablePath<T> {
  return !!path.node.loc;
}

function isSelectableNode(node: t.Node | null): node is SelectableNode {
  return !!node && !!node.loc;
}

function isSelectableIdentifier(
  node: t.Node | null
): node is SelectableIdentifier {
  return t.isIdentifier(node) && isSelectableNode(node);
}

function isSelectableVariableDeclarator(
  declaration: t.VariableDeclarator
): declaration is SelectableVariableDeclarator {
  return !!declaration.loc;
}

function isSelectableObjectProperty(
  property: t.Node | null
): property is SelectableObjectProperty {
  return (
    t.isObjectProperty(property) &&
    isSelectableNode(property) &&
    isSelectableNode(property.value) &&
    isSelectableNode(property.key)
  );
}
