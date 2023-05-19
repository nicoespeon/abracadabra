import * as t from "../../ast";
import { isSelectablePath, parse } from "../../ast";
import { isFunctionDeclarationOrArrowFunction } from "../../ast/identity";
import { Editor, ErrorReason, SelectedPosition } from "../../editor/editor";
import { Path } from "../../editor/path";
import { Position } from "../../editor/position";
import { Selection } from "../../editor/selection";

export async function changeSignature(editor: Editor) {
  const { code, selection } = editor;
  const { fixedSelection, params } = getParams(code, selection);

  if (!params) {
    editor.showError(ErrorReason.CantChangeSignature);
    return;
  }

  await editor.askForPositions(params, async (newPositions) => {
    const references = await editor.getSelectionReferences(fixedSelection);

    const filesContent = await Promise.all(
      references.map(async (reference) => {
        const content = await editor.codeOf(reference.path);
        return {
          code: content,
          path: reference.path,
          selection: reference.selection
        };
      })
    );

    const alreadyTransformed: Record<string, string> = {};
    const result: {
      path: Path;
      transformed: t.Transformed;
    }[] = [];

    for (const x of filesContent) {
      const codeToTransform =
        alreadyTransformed[x.path.value] || (x.code as string);

      try {
        const transformed = updateCode(
          t.parse(codeToTransform),
          x.selection,
          newPositions
        );

        alreadyTransformed[x.path.value] = `${transformed.code}`;

        result.push({
          path: x.path,
          transformed
        });
      } catch (error) {
        editor.showError(ErrorReason.CantChangeSignature);
        return;
      }
    }

    await Promise.all(
      result.map(async (result) => {
        await editor.writeIn(
          result.path,
          alreadyTransformed[result.path.value]
        );
      })
    );
  });
}

type Params = { label: string; value: { startAt: number; endAt: number } }[];

function getParams(
  code: string,
  selection: Selection
): { params: Params | null; fixedSelection: Selection } {
  let result: Params | null = null;
  let arrowSelection: Selection = selection;

  t.parseAndTraverseCode(
    code,
    createVisitor(selection, (path, aArrowSelection) => {
      result = path.node.params.map((p, index) => {
        return {
          label: getParamName(p),
          value: {
            startAt: index,
            endAt: index
          }
        };
      });

      arrowSelection = aArrowSelection;
      path.stop();
    })
  );

  return {
    params: result,
    fixedSelection: arrowSelection
  };
}

function updateCode(
  ast: t.AST,
  selection: Selection,
  newPositions: SelectedPosition[]
): t.Transformed {
  return t.transformAST(
    ast,
    createVisitorForReferences(selection, (path) => {
      const node = path.node;

      if (t.isCallExpression(node)) {
        const args = node.arguments.slice().filter((_param, index) => {
          return !hasRemovedTheParameter(newPositions[index]);
        });

        if (args.length) {
          newPositions.forEach((order) => {
            if (isNewParameter(order)) {
              // Convert to a valid code.
              // Without that will trigger invalid "Missing semicolon (n, n)"
              // That error occurs only for literal objects like: {id: 1, ...}
              const fakedBlockCode = `const faked = ${order.value.val}`;
              const parsed = parse(fakedBlockCode);
              const node = parsed.program.body[0];

              if (t.isVariableDeclaration(node)) {
                const variableDeclarator = node.declarations[0];
                if (variableDeclarator.init) {
                  args[order.value.endAt] = variableDeclarator.init;
                }
              }
            } else {
              args[order.value.endAt] = node.arguments[order.value.startAt];
            }
          });
        }

        node.arguments = args.map((arg) => {
          if (arg) return arg;

          return t.identifier("undefined");
        });
      } else if (
        isFunctionDeclarationOrArrowFunction(node) ||
        t.isClassMethod(node)
      ) {
        const params = node.params.slice().filter((_param, index) => {
          return !hasRemovedTheParameter(newPositions[index]);
        });

        if (params.length) {
          newPositions.forEach((order) => {
            if (isNewParameter(order)) {
              params[order.value.endAt] = t.identifier(order.label);
            } else {
              params[order.value.endAt] = node.params[order.value.startAt];
            }
          });
        }

        node.params = params;
      }

      path.stop();
    })
  );
}

export function createVisitor(
  selection: Selection,
  onMatch: (
    path: t.NodePath<
      t.FunctionDeclaration | t.ArrowFunctionExpression | t.ClassMethod
    >,
    arrowSelection: Selection
  ) => void
): t.Visitor {
  return {
    FunctionDeclaration(path) {
      if (!selection.isInsidePath(path)) return;
      if (!hasParameters(path.node)) return;

      onMatch(path, selection);
    },
    ArrowFunctionExpression(path) {
      if (!selection.isInsidePath(path)) return;
      if (!hasParameters(path.node)) return;
      if (!t.isVariableDeclarator(path.parent)) return;
      if (!path.parent.loc) return;

      onMatch(path, Selection.fromAST(path.parent.loc));
    },
    ClassMethod(path) {
      if (!selection.isInsidePath(path)) return;
      if (!hasParameters(path.node)) return;

      onMatch(path, selection);
    }
  };
}

function getParamName(
  param:
    | t.Identifier
    | t.Pattern
    | t.RestElement
    | t.LVal
    | t.ObjectProperty
    | t.PatternLike
    | t.Expression
    | t.PrivateName
): string {
  if ("name" in param) {
    return param.name;
  }

  if (t.isRestElement(param)) {
    return `...${getParamName(param.argument)}`;
  }

  if (t.isObjectPattern(param)) {
    const names: string[] = param.properties.map((property) => {
      if ("key" in property) return getParamName(property.key);

      return getParamName(property);
    });
    // For object destructuring put {param} as name
    return `{${names.join(", ")}}`;
  }

  if (t.isAssignmentPattern(param)) {
    return getParamName(param.left);
  }

  if (t.isArrayPattern(param)) {
    const names: string[] = param.elements.map((element) => {
      return getParamName(element as t.PatternLike);
    });

    // For array destructuring put [param] as name
    return `[${names.join(", ")}]`;
  }

  return "unknown";
}

function createVisitorForReferences(
  selection: Selection,
  onMatch: (path: t.NodePath) => void
): t.Visitor {
  return {
    CallExpression(path) {
      if (!isSelectablePath(path)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      const start = Position.fromAST(path.node.loc.start).putAtStartOfLine();
      const end = Position.fromAST(path.node.loc.end).putAtStartOfLine();
      const nodeSelection = Selection.fromPositions(start, end);

      if (!selection.start.isSameLineThan(nodeSelection.start)) return;

      onMatch(path);
    },
    FunctionDeclaration(path) {
      if (!selection.isInsidePath(path)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      onMatch(path);
    },
    ArrowFunctionExpression(path) {
      if (!selection.isInsidePath(path.parentPath)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      onMatch(path);
    },
    ClassMethod(path) {
      if (!selection.isInsidePath(path)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      onMatch(path);
    }
  };
}

function hasChildWhichMatchesSelection(
  path: t.NodePath,
  selection: Selection
): boolean {
  let result = false;

  path.traverse({
    CallExpression(childPath) {
      if (!isSelectablePath(childPath)) return;

      const start = Position.fromAST(
        childPath.node.loc.start
      ).putAtStartOfLine();
      const end = Position.fromAST(childPath.node.loc.end).putAtStartOfLine();
      const nodeSelection = Selection.fromPositions(start, end);

      if (!selection.start.isSameLineThan(nodeSelection.start)) return;

      result = true;
      childPath.stop();
    },
    FunctionDeclaration(childPath) {
      if (!selection.isInsidePath(childPath)) return;

      result = true;
      childPath.stop();
    },
    ArrowFunctionExpression(childPath) {
      if (!selection.isInsidePath(childPath.parentPath)) return;

      result = true;
      childPath.stop();
    },
    ClassMethod(childPath) {
      if (!selection.isInsidePath(childPath)) return;

      result = true;
      childPath.stop();
    }
  });

  return result;
}

function hasParameters(
  node: t.FunctionDeclaration | t.ArrowFunctionExpression | t.ClassMethod
) {
  return node.params.length > 0;
}

function isNewParameter(order: SelectedPosition) {
  return order.value.startAt === -1;
}

function hasRemovedTheParameter(order: SelectedPosition) {
  return order.value.endAt === -1;
}
