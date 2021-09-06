import { Editor, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { addNumericSeparator, createVisitor };

async function addNumericSeparator(editor: Editor) {
  const { code, selection } = editor;
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindNumericLiteral);
    return;
  }

  await editor.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path) => {
      // @ts-expect-error Need to use a string to persist the separators
      path.node.value = addSeparators(path.node.value);
    })
  );
}

function addSeparators(value: number): string {
  const [decimalPart, floatingPart] = value.toString().split(".");
  let result = decimalPart.slice(-3);

  // Add chunks of 3 chars
  for (let i = 1; i <= Math.ceil(decimalPart.length / 3); i += 1) {
    result = `${decimalPart.slice((i + 1) * -3, i * -3)}_${result}`;
  }

  // Trim the leading `_`
  result = result.slice(1);

  return floatingPart ? `${result}.${floatingPart}` : result;
}

function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<t.NumericLiteral>) => void
): t.Visitor {
  return {
    NumericLiteral(path) {
      if (!selection.isInsidePath(path)) return;
      onMatch(path);
    }
  };
}
