import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

export {
  getPreviousSibling,
  getNextSibling,
  hasSiblingStatement,
  getPreviousSiblingStatements,
  getNextSiblingStatements
};

function getPreviousSibling(path: NodePath): NodePath | undefined {
  return path.getAllPrevSiblings()[0];
}

function getNextSibling(path: NodePath): NodePath | undefined {
  return path.getAllNextSiblings()[0];
}

function hasSiblingStatement(path: NodePath): boolean {
  const allSiblingStatements = [
    ...getPreviousSiblingStatements(path),
    ...getNextSiblingStatements(path)
  ];

  return allSiblingStatements.length > 0;
}

function getPreviousSiblingStatements(path: NodePath): t.Statement[] {
  return path
    .getAllPrevSiblings()
    .map(({ node }) => node)
    .filter(isStatement);
}

function getNextSiblingStatements(path: NodePath): t.Statement[] {
  return path
    .getAllNextSiblings()
    .map(({ node }) => node)
    .filter(isStatement);
}

function isStatement(node: t.Node): node is t.Statement {
  return t.isStatement(node);
}
