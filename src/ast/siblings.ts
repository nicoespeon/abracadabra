import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

export { getPreviousSiblingStatements, getNextSiblingStatements };

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
