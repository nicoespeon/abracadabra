import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

export * from "@babel/types";
export {
  addImportDeclaration,
  getImportDeclarations,
  getReturnedStatement,
  getAssignedStatement,
  getStatements,
  getNodesBelow,
  getPathsBelow,
  isEmpty,
  isLet,
  replaceWithBodyOf,
  Primitive,
  TypeDeclaration,
  forEach,
  statementWithBraces,
  statementWithoutBraces,
  toArrowFunctionExpression
};

function addImportDeclaration(
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

function getImportDeclarations(
  programPath: NodePath<t.Program>
): t.ImportDeclaration[] {
  return programPath.node.body.filter(
    (statement): statement is t.ImportDeclaration =>
      t.isImportDeclaration(statement)
  );
}

function getReturnedStatement(
  node: t.Statement | null
): t.ReturnStatement | null {
  if (!t.isBlockStatement(node)) return null;

  const firstChild = node.body[0];
  if (!t.isReturnStatement(firstChild)) return null;

  return firstChild;
}

function getAssignedStatement(
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

function getStatements(statement: t.Statement): t.Statement[] {
  return t.isBlockStatement(statement) ? statement.body : [statement];
}

function getNodesBelow(path: NodePath<t.IfStatement>): t.Statement[] {
  return getPathsBelow(path).map((path) => path.node);
}

function getPathsBelow(path: NodePath<t.IfStatement>): NodePath<t.Statement>[] {
  return path
    .getAllNextSiblings()
    .filter((path): path is NodePath<t.Statement> => t.isStatement(path));
}

function isEmpty(statement: t.Statement): boolean {
  const statements = getStatements(statement).filter(
    (child) => child !== statement
  );

  return statements.length === 0;
}

function isLet(node: t.Node): node is t.VariableDeclaration {
  return "kind" in node && node.kind === "let";
}

function replaceWithBodyOf(path: NodePath, node: t.Statement) {
  path.replaceWithMultiple(getStatements(node));
}

type Primitive =
  | t.StringLiteral
  | t.NumberLiteral
  | t.BooleanLiteral
  | t.BigIntLiteral;

type TypeDeclaration = t.TSTypeAliasDeclaration | t.TSInterfaceDeclaration;

function forEach(
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

function statementWithBraces(node: t.Statement): t.Statement {
  return t.isBlockStatement(node) ? node : t.blockStatement([node]);
}

function statementWithoutBraces(node: t.Statement): t.Statement {
  return t.isBlockStatement(node) ? node.body[0] : node;
}

function toArrowFunctionExpression({
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
