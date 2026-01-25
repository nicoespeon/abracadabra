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
  return t.transformAST(
    ast,
    createVisitor(selection, (path, classPath, methodPath) => {
      const declaration = path.node.declarations[0];
      if (!t.isIdentifier(declaration.id)) return;
      if (!declaration.init) return;

      const variableName = declaration.id.name;

      addPropertyToConstructor(classPath, variableName);
      replaceDeclarationWithAssignment(path, variableName, declaration.init);
      replaceReferencesInMethod(methodPath, variableName);
    })
  );
}

function addPropertyToConstructor(
  classPath: t.NodePath<t.ClassDeclaration | t.ClassExpression>,
  variableName: string
) {
  const constructorMethod = findConstructor(classPath);

  const propertyAssignment = t.expressionStatement(
    t.assignmentExpression(
      "=",
      t.memberExpression(t.thisExpression(), t.identifier(variableName)),
      t.nullLiteral()
    )
  );

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
