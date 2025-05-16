import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

export * from "@babel/types";

export type PathWithId<T extends NodePath> = T & { node: { id: t.Identifier } };

export function hasNodeId<T extends NodePath>(path: T): path is PathWithId<T> {
  return hasId(path.node);
}

export type WithId<T extends t.Node> = T & { id: t.Identifier };

export function hasId<T extends t.Node>(node: T): node is WithId<T> {
  return "id" in node && node.id !== undefined;
}

export function addImportDeclaration(
  programPath: NodePath<t.Program>,
  identifier: t.Identifier,
  sourcePath: string
) {
  const importSpecifier = t.importSpecifier(identifier, identifier);

  const existingDeclaration = getImportDeclarations(programPath).find(
    ({ source: { value } }) => value === sourcePath
  );

  if (existingDeclaration) {
    existingDeclaration.specifiers.push(importSpecifier);
    return;
  }

  const importStatement = t.importDeclaration(
    [importSpecifier],
    t.stringLiteral(sourcePath)
  );
  programPath.node.body.unshift(importStatement);
}

export function getImportDeclarations(
  programPath: NodePath<t.Program>
): t.ImportDeclaration[] {
  return programPath.node.body.filter(
    (statement): statement is t.ImportDeclaration =>
      t.isImportDeclaration(statement)
  );
}

export function getReturnedStatement(
  node: t.Statement | null
): t.ReturnStatement | null {
  if (!t.isBlockStatement(node)) return null;

  const firstChild = node.body[0];
  if (!t.isReturnStatement(firstChild)) return null;

  return firstChild;
}

export function getAssignedStatement(
  node: t.Statement | null
): (t.ExpressionStatement & { expression: t.AssignmentExpression }) | null {
  if (!t.isBlockStatement(node)) return null;
  if (node.body.length > 1) return null;

  const firstChild = node.body[0];
  if (!t.isExpressionStatement(firstChild)) return null;

  const expression = firstChild.expression;
  if (!t.isAssignmentExpression(expression)) return null;

  return { ...firstChild, expression };
}

export function getStatements(
  statement: t.Statement | null | undefined
): t.Statement[] {
  if (!statement) return [];
  return t.isBlockStatement(statement) ? statement.body : [statement];
}

export function getNodesBelow(path: NodePath<t.IfStatement>): t.Statement[] {
  return getPathsBelow(path).map((path) => path.node);
}

export function getPathsBelow(
  path: NodePath<t.IfStatement>
): NodePath<t.Statement>[] {
  return path
    .getAllNextSiblings()
    .filter((path): path is NodePath<t.Statement> => t.isStatement(path));
}

export function isEmpty(statement: t.Statement | null | undefined): boolean {
  const statements = getStatements(statement).filter(
    (child) => child !== statement
  );

  return statements.length === 0;
}

export function isLet(node: t.Node): node is t.VariableDeclaration {
  return "kind" in node && node.kind === "let";
}

export function replaceWithBodyOf(path: NodePath, node: t.Statement) {
  path.replaceWithMultiple(getStatements(node));
}

export type Primitive =
  | t.StringLiteral
  | t.NumberLiteral
  | t.BooleanLiteral
  | t.BigIntLiteral;

export type TypeDeclaration =
  | t.TSTypeAliasDeclaration
  | t.TSInterfaceDeclaration;

export function forEach(
  object: t.Expression,
  params: t.ArrowFunctionExpression["params"],
  body: t.BlockStatement
): t.ExpressionStatement {
  return t.expressionStatement(
    t.callExpression(t.memberExpression(object, t.identifier("forEach")), [
      t.arrowFunctionExpression(params, body)
    ])
  );
}

export function statementWithBraces(node: t.Statement): t.Statement {
  return t.isBlockStatement(node) ? node : t.blockStatement([node]);
}

export function statementWithoutBraces(node: t.Statement): t.Statement {
  return t.isBlockStatement(node) ? node.body[0] : node;
}

export function pushToBody(node: t.Statement, statement: t.Statement) {
  if (t.isBlockStatement(node)) {
    node.body.push(statement);
  } else {
    node = t.blockStatement([node, statement]);
  }
}

export function toArrowFunctionExpression({
  node
}: NodePath<t.FunctionDeclaration | t.FunctionExpression>) {
  const arrowFunctionExpression = t.arrowFunctionExpression(
    node.params,
    node.body,
    node.async
  );
  arrowFunctionExpression.returnType = node.returnType;
  arrowFunctionExpression.typeParameters = node.typeParameters;

  return arrowFunctionExpression;
}

export function cloneWithoutType<T extends t.Node>(node: T): T {
  const nodeWithoutType = t.cloneNode(node);
  if ("typeAnnotation" in nodeWithoutType) {
    nodeWithoutType.typeAnnotation = undefined;
  }

  return nodeWithoutType;
}
