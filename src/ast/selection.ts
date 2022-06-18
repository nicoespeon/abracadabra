import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

export interface ASTSelection {
  start: ASTPosition;
  end: ASTPosition;
}

export interface ASTPosition {
  line: number;
  column: number;
}

export type SelectablePath<T = t.Node> = NodePath<T> & {
  node: Selectable<T>;
  hasNode: NodePath<T>["hasNode"];
};
export type SelectableNode = Selectable<t.Node>;
export type SelectableIdentifier = Selectable<t.Identifier>;
export type SelectableVariableDeclarator = Selectable<t.VariableDeclarator>;
export type Selectable<T> = T & { loc: t.SourceLocation };

export interface SelectableObjectProperty extends t.ObjectProperty {
  loc: t.SourceLocation;
  key: Selectable<t.ObjectProperty["key"]>;
  value: Selectable<t.ObjectProperty["value"]>;
}

export function isSelectablePath<T extends t.Node>(
  path: NodePath<T>
): path is SelectablePath<T> {
  return !!path.node.loc;
}

export function isSelectableNode(node: t.Node | null): node is SelectableNode {
  return !!node && !!node.loc;
}

export function isSelectableIdentifier(
  node: t.Node | null
): node is SelectableIdentifier {
  return t.isIdentifier(node) && isSelectableNode(node);
}

export function isSelectableVariableDeclarator(
  declaration: t.VariableDeclarator
): declaration is SelectableVariableDeclarator {
  return !!declaration.loc;
}

export function isSelectableObjectProperty(
  property: t.Node | null
): property is SelectableObjectProperty {
  return (
    t.isObjectProperty(property) &&
    isSelectableNode(property) &&
    isSelectableNode(property.value) &&
    isSelectableNode(property.key)
  );
}
