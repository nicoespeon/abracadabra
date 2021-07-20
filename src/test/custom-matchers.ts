import { InMemoryEditor } from "../editor/adapters/in-memory-editor";
import { Code } from "../editor/editor";
import { Selection } from "../editor/selection";
import * as t from "../ast";

declare global {
  namespace jest {
    interface Matchers<R> {
      toMatchEditor(editor: InMemoryEditor): Promise<R>;
    }
  }
}

expect.extend({
  async toMatchEditor(
    createVisitor: (selection: Selection, onMatch: Function) => t.Visitor,
    editor: InMemoryEditor
  ) {
    const pass = await isMatchingVisitor(editor.code, (onMatch) =>
      createVisitor(editor.selection, () => onMatch())
    );

    if (pass) {
      return {
        message: () => `Expected visitor to NOT match given code, but it did`,
        pass: true
      };
    } else {
      return {
        message: () => `Expected visitor to match given code, but it didn't`,
        pass: false
      };
    }
  }
});

function isMatchingVisitor(
  code: Code,
  createVisitor: (onMatch: Function) => t.Visitor
): Promise<boolean> {
  const STOP_IDENTIFIER_NAME = "STOP_HERE";
  const codeWithStopIdentifier = `${code}
let ${STOP_IDENTIFIER_NAME};`;

  return new Promise<boolean>((resolve) => {
    const visitor = createVisitor(() => resolve(true));

    t.traverseAST(t.parse(codeWithStopIdentifier), {
      ...visitor,
      Identifier(path) {
        // Ensures that we will return if we have found nothing.
        // Assumes we traverse the AST from top to bottom.
        if (path.node.name === STOP_IDENTIFIER_NAME) {
          path.stop();
          resolve(false);
        }
      }
    });
  });
}
