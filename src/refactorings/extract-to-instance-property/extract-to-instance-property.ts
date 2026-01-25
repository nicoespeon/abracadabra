import * as t from "../../ast";
import { Selection } from "../../editor/selection";
import { COMMANDS, EditorCommand, RefactoringState } from "../../refactorings";

export function extractToInstanceProperty(
  state: RefactoringState
): EditorCommand {
  if (state.state !== "new") return COMMANDS.doNothing();

  const { code, selection } = state;
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    return COMMANDS.showErrorDidNotFind(
      "variable declaration to extract (must be inside a class method)"
    );
  }

  return COMMANDS.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  const isTypeScript = detectTypeScript(ast);

  return t.transformAST(
    ast,
    createVisitor(selection, (path, classPath, methodPath) => {
      const declaration = path.node.declarations[0];
      if (!t.isIdentifier(declaration.id)) return;
      if (!declaration.init) return;

      const variableName = declaration.id.name;
      const typeAnnotation = declaration.id.typeAnnotation;
      const tsTypeAnnotation =
        typeAnnotation && t.isTSTypeAnnotation(typeAnnotation)
          ? typeAnnotation
          : inferTypeAnnotation(declaration.init);

      if (isTypeScript) {
        addClassPropertyTS(classPath, variableName, tsTypeAnnotation);
      } else {
        addPropertyToConstructorJS(classPath, variableName);
      }

      replaceDeclarationWithAssignment(path, variableName, declaration.init);
      replaceReferencesInMethod(methodPath, variableName);
    })
  );
}

function detectTypeScript(ast: t.AST): boolean {
  let hasTypeScriptSyntax = false;

  t.traverseAST(ast, {
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

function addClassPropertyTS(
  classPath: t.NodePath<t.ClassDeclaration | t.ClassExpression>,
  variableName: string,
  typeAnnotation: t.TSTypeAnnotation | null
) {
  const propertyType = createPropertyType(typeAnnotation);

  const classProperty = t.classProperty(
    t.identifier(variableName),
    t.nullLiteral(),
    propertyType,
    [],
    false,
    false
  );
  classProperty.accessibility = "private";

  const classBody = classPath.get("body");
  const existingDataProperties = classBody.node.body.filter(
    (member) => t.isClassProperty(member) && !isMethodLikeProperty(member)
  );

  if (existingDataProperties.length > 0) {
    const lastPropertyIndex = classBody.node.body.lastIndexOf(
      existingDataProperties[existingDataProperties.length - 1]
    );
    classBody.node.body.splice(lastPropertyIndex + 1, 0, classProperty);
  } else {
    classBody.unshiftContainer("body", classProperty);
  }
}

function addPropertyToConstructorJS(
  classPath: t.NodePath<t.ClassDeclaration | t.ClassExpression>,
  variableName: string
) {
  const propertyAssignment = t.expressionStatement(
    t.assignmentExpression(
      "=",
      t.memberExpression(t.thisExpression(), t.identifier(variableName)),
      t.nullLiteral()
    )
  );

  const constructorMethod = findConstructor(classPath);

  if (constructorMethod) {
    const body = constructorMethod.get("body") as t.NodePath<t.BlockStatement>;
    body.node.body.push(propertyAssignment);
  } else {
    const constructor = t.classMethod(
      "constructor",
      t.identifier("constructor"),
      [],
      t.blockStatement([propertyAssignment])
    );

    const classBody = classPath.get("body");
    classBody.unshiftContainer("body", constructor);
  }
}

function findConstructor(
  classPath: t.NodePath<t.ClassDeclaration | t.ClassExpression>
): t.NodePath<t.ClassMethod> | undefined {
  let result: t.NodePath<t.ClassMethod> | undefined;

  classPath.traverse({
    ClassMethod(path) {
      if (
        path.node.kind === "constructor" ||
        (t.isIdentifier(path.node.key) && path.node.key.name === "constructor")
      ) {
        result = path;
        path.stop();
      }
    }
  });

  return result;
}

function isMethodLikeProperty(node: t.Node): boolean {
  return (
    t.isClassProperty(node) &&
    (t.isArrowFunctionExpression(node.value) ||
      t.isFunctionExpression(node.value))
  );
}

function inferTypeAnnotation(init: t.Expression): t.TSTypeAnnotation | null {
  const inferredType = inferTypeFromExpression(init);
  if (!inferredType) return null;

  return t.tsTypeAnnotation(inferredType);
}

function inferTypeFromExpression(expr: t.Expression): t.TSType | null {
  if (t.isNumericLiteral(expr)) {
    return t.tsNumberKeyword();
  }

  if (t.isStringLiteral(expr) || t.isTemplateLiteral(expr)) {
    return t.tsStringKeyword();
  }

  if (t.isBooleanLiteral(expr)) {
    return t.tsBooleanKeyword();
  }

  if (t.isArrayExpression(expr)) {
    if (expr.elements.length === 0) {
      return t.tsArrayType(t.tsUnknownKeyword());
    }

    const firstElement = expr.elements[0];
    if (firstElement && t.isExpression(firstElement)) {
      const elementType = inferTypeFromExpression(firstElement);
      if (elementType) {
        return t.tsArrayType(elementType);
      }
    }

    return t.tsArrayType(t.tsUnknownKeyword());
  }

  if (t.isBinaryExpression(expr)) {
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
      return t.tsNumberKeyword();
    }

    if (expr.operator === "+") {
      const leftType = t.isExpression(expr.left)
        ? inferTypeFromExpression(expr.left)
        : null;
      const rightType = inferTypeFromExpression(expr.right);

      if (
        (leftType && t.isTSStringKeyword(leftType)) ||
        (rightType && t.isTSStringKeyword(rightType))
      ) {
        return t.tsStringKeyword();
      }

      return t.tsNumberKeyword();
    }
  }

  if (t.isUnaryExpression(expr)) {
    if (expr.operator === "!" || expr.operator === "delete") {
      return t.tsBooleanKeyword();
    }
    if (
      expr.operator === "-" ||
      expr.operator === "+" ||
      expr.operator === "~"
    ) {
      return t.tsNumberKeyword();
    }
    if (expr.operator === "typeof") {
      return t.tsStringKeyword();
    }
  }

  if (t.isObjectExpression(expr)) {
    return t.tsObjectKeyword();
  }

  return null;
}

function createPropertyType(
  typeAnnotation: t.TSTypeAnnotation | null
): t.TSTypeAnnotation | null {
  if (!typeAnnotation) {
    return null;
  }

  const originalType = typeAnnotation.typeAnnotation;
  const nullType = t.tsNullKeyword();
  const unionType = t.tsUnionType([originalType, nullType]);

  return t.tsTypeAnnotation(unionType);
}

function replaceDeclarationWithAssignment(
  path: t.NodePath<t.VariableDeclaration>,
  variableName: string,
  init: t.Expression
) {
  const assignment = t.expressionStatement(
    t.assignmentExpression(
      "=",
      t.memberExpression(t.thisExpression(), t.identifier(variableName)),
      init
    )
  );

  path.replaceWith(assignment);
}

function replaceReferencesInMethod(
  methodPath: t.NodePath<t.ClassMethod | t.ClassProperty>,
  variableName: string
) {
  methodPath.traverse({
    Identifier(identifierPath) {
      if (identifierPath.node.name !== variableName) return;

      if (
        identifierPath.parent &&
        t.isMemberExpression(identifierPath.parent) &&
        identifierPath.parent.property === identifierPath.node &&
        !identifierPath.parent.computed
      ) {
        return;
      }

      if (
        identifierPath.parent &&
        t.isVariableDeclarator(identifierPath.parent) &&
        identifierPath.parent.id === identifierPath.node
      ) {
        return;
      }

      if (!identifierPath.isReferencedIdentifier()) return;

      identifierPath.replaceWith(
        t.memberExpression(t.thisExpression(), t.identifier(variableName))
      );
    }
  });
}

type MethodLikePath = t.NodePath<t.ClassMethod | t.ClassProperty>;

export function createVisitor(
  selection: Selection,
  onMatch: (
    path: t.NodePath<t.VariableDeclaration>,
    classPath: t.NodePath<t.ClassDeclaration | t.ClassExpression>,
    methodPath: MethodLikePath
  ) => void
): t.Visitor {
  return {
    VariableDeclaration(path) {
      if (!selection.isInsidePath(path)) return;

      const declarations = path.node.declarations;
      if (declarations.length !== 1) return;

      const declaration = declarations[0];
      if (!t.isIdentifier(declaration.id)) return;
      if (!declaration.init) return;

      const methodPath = findParentMethod(path);
      if (!methodPath) return;

      const classPath = findParentClass(path);
      if (!classPath) return;

      onMatch(path, classPath, methodPath);
    }
  };
}

function findParentMethod(path: t.NodePath): MethodLikePath | null {
  let current: t.NodePath | null = path;

  while (current) {
    if (t.isClassMethod(current.node)) {
      return current as t.NodePath<t.ClassMethod>;
    }

    if (
      t.isClassProperty(current.node) &&
      (t.isArrowFunctionExpression(current.node.value) ||
        t.isFunctionExpression(current.node.value))
    ) {
      return current as t.NodePath<t.ClassProperty>;
    }

    current = current.parentPath;
  }

  return null;
}

function findParentClass(
  path: t.NodePath
): t.NodePath<t.ClassDeclaration | t.ClassExpression> | null {
  let current: t.NodePath | null = path;

  while (current) {
    if (
      t.isClassDeclaration(current.node) ||
      t.isClassExpression(current.node)
    ) {
      return current as t.NodePath<t.ClassDeclaration | t.ClassExpression>;
    }

    current = current.parentPath;
  }

  return null;
}
