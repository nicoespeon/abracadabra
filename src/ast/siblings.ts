import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

export function getPreviousSibling(path: NodePath): NodePath | undefined {
  return path.getAllPrevSiblings()[0];
}

export function hasPreviousSibling(path: NodePath): boolean {
  const siblings = getPreviousSiblingStatements(path);
  return siblings && siblings.length > 0;
}

export function getNextSibling(path: NodePath): NodePath | undefined {
  return path.getAllNextSiblings()[0];
}

export function hasNextSibling(path: NodePath): boolean {
  const siblings = getNextSiblingStatements(path);
  return siblings && siblings.length > 0;
}

export function hasSiblingStatement(path: NodePath): boolean {
  return hasPreviousSibling(path) || hasNextSibling(path);
}

export function getPreviousSiblingStatements(path: NodePath): t.Statement[] {
  return path
    .getAllPrevSiblings()
    .map(({ node }) => node)
    .filter(isStatement);
}

export function getNextSiblingStatements(path: NodePath): t.Statement[] {
  return path
    .getAllNextSiblings()
    .map(({ node }) => node)
    .filter(isStatement);
}

function isStatement(node: t.Node): node is t.Statement {
  return t.isStatement(node);
}
