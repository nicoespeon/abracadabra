import * as t from "../../ast";
import { Code } from "../../editor/editor";
import { Position } from "../../editor/position";
import { Selection } from "../../editor/selection";
import { COMMANDS, EditorCommand, RefactoringState } from "../../refactorings";

export function convertToTemplateLiteral(
  state: RefactoringState
): EditorCommand {
  const { code, selection } = state;
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    return COMMANDS.showErrorDidNotFind("string to convert");
  }

  const newCode = updatedCode.code.replace(/\$\\{(\w*)}/g, "${$1}");
  return COMMANDS.write(newCode, updatedCode.newCursorPosition);
}

function updateCode(
  ast: t.AST,
  selection: Selection
): t.Transformed & { newCursorPosition: Position } {
  let newCursorPosition = selection.start;

  const transformedCode = t.transformAST(
    ast,
    createVisitor(selection, (path) => {
      const sanitizedValue = path.node.value
        .replace(/`/g, "\\`")
        .replace(/{/g, "\\{");
      const templateLiteral = t.templateLiteral(
        [t.templateElement(sanitizedValue)],
        []
      );

      if (t.isJSXAttribute(path.parentPath?.node)) {
        // Case of <MyComponent prop="test" /> => <MyComponent prop={`test`} />
        path.replaceWith(t.jsxExpressionContainer(templateLiteral));
        newCursorPosition = newCursorPosition.addCharacters(1);
      } else {
        t.replaceWithPreservingComments(path, templateLiteral);
      }

      path.stop();
    })
  );

  return { ...transformedCode, newCursorPosition };
}

export function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<t.StringLiteral>) => void
): t.Visitor {
  return {
    StringLiteral(path) {
      if (!selection.isInsidePath(path)) return;

      // In that case, VS Code will handle it.
      if (t.isBinaryExpression(path.parentPath?.node)) return;

      // If we are inside of an import statement, dont show refactoring
      if (t.isImportDeclaration(path.parentPath?.node)) return;

      onMatch(path);
    }
  };
}

export function isInsertingVariableInStringLiteral(
  code: Code,
  selection: Selection
): boolean {
  const lines = code.split("\n");
  const currentLine = lines[selection.start.line] ?? "";
  const previous2Chars =
    currentLine[selection.start.character - 2] +
    currentLine[selection.start.character - 1];
  if (previous2Chars !== "${") return false;

  const nextChar = currentLine[selection.start.character];
  if (nextChar !== "}") return false;

  let result = false;
  t.traverseAST(
    t.parse(code),
    createVisitor(selection, () => (result = true))
  );
  return result;
}
