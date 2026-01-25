import {
  Expression,
  isArrayExpression,
  isBinaryExpression,
  isBooleanLiteral,
  isExpression,
  isNumericLiteral,
  isObjectExpression,
  isStringLiteral,
  isTemplateLiteral,
  isTSStringKeyword,
  isUnaryExpression,
  tsArrayType,
  tsBooleanKeyword,
  tsNumberKeyword,
  tsObjectKeyword,
  tsStringKeyword,
  TSType,
  TSTypeAnnotation,
  tsTypeAnnotation,
  tsUnknownKeyword
} from "@babel/types";
import { AST, traverseAST } from "./transformation";

export function isTypeScriptCode(ast: AST): boolean {
  let hasTypeScriptSyntax = false;

  traverseAST(ast, {
    TSTypeAnnotation() {
      hasTypeScriptSyntax = true;
    },
    TSInterfaceDeclaration() {
      hasTypeScriptSyntax = true;
    },
    TSTypeAliasDeclaration() {
      hasTypeScriptSyntax = true;
    },
    TSAsExpression() {
      hasTypeScriptSyntax = true;
    },
    TSEnumDeclaration() {
      hasTypeScriptSyntax = true;
    },
    ClassProperty(path) {
      if (path.node.accessibility) {
        hasTypeScriptSyntax = true;
      }
    }
  });

  return hasTypeScriptSyntax;
}

export function inferTypeAnnotation(init: Expression): TSTypeAnnotation | null {
  const inferredType = inferTypeFromExpression(init);
  if (!inferredType) return null;

  return tsTypeAnnotation(inferredType);
}

export function inferTypeFromExpression(expr: Expression): TSType | null {
  if (isNumericLiteral(expr)) {
    return tsNumberKeyword();
  }

  if (isStringLiteral(expr) || isTemplateLiteral(expr)) {
    return tsStringKeyword();
  }

  if (isBooleanLiteral(expr)) {
    return tsBooleanKeyword();
  }

  if (isArrayExpression(expr)) {
    if (expr.elements.length === 0) {
      return tsArrayType(tsUnknownKeyword());
    }

    const firstElement = expr.elements[0];
    if (firstElement && isExpression(firstElement)) {
      const elementType = inferTypeFromExpression(firstElement);
      if (elementType) {
        return tsArrayType(elementType);
      }
    }

    return tsArrayType(tsUnknownKeyword());
  }

  if (isBinaryExpression(expr)) {
    const arithmeticOperators = [
      "*",
      "/",
      "-",
      "%",
      "**",
      "<<",
      ">>",
      ">>>",
      "&",
      "|",
      "^"
    ];
    if (arithmeticOperators.includes(expr.operator)) {
      return tsNumberKeyword();
    }

    if (expr.operator === "+") {
      const leftType = isExpression(expr.left)
        ? inferTypeFromExpression(expr.left)
        : null;
      const rightType = inferTypeFromExpression(expr.right);

      if (
        (leftType && isTSStringKeyword(leftType)) ||
        (rightType && isTSStringKeyword(rightType))
      ) {
        return tsStringKeyword();
      }

      return tsNumberKeyword();
    }
  }

  if (isUnaryExpression(expr)) {
    if (expr.operator === "!" || expr.operator === "delete") {
      return tsBooleanKeyword();
    }
    if (
      expr.operator === "-" ||
      expr.operator === "+" ||
      expr.operator === "~"
    ) {
      return tsNumberKeyword();
    }
    if (expr.operator === "typeof") {
      return tsStringKeyword();
    }
  }

  if (isObjectExpression(expr)) {
    return tsObjectKeyword();
  }

  return null;
}
