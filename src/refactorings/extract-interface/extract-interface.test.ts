import { Editor, ErrorReason, Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { extractInterface } from "./extract-interface";

describe.only("Extract Interface", () => {
  let showErrorMessage: Editor["showError"];

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; selection?: Selection; expected: Code }>(
    "should extract interface",
    [
      {
        description: "class with public method",
        code: `class Position {
  isEqualTo(position: Position): boolean {
    return true;
  }
}`,
        expected: `class Position implements Extracted {
  isEqualTo(position: Position): boolean {
    return true;
  }
}

interface Extracted {
  isEqualTo(position: Position): boolean;
}`
      },
      {
        description: "method with optional params",
        code: `class Position {
  isEqualTo(position?: Position): boolean {
    return true;
  }
}`,
        expected: `class Position implements Extracted {
  isEqualTo(position?: Position): boolean {
    return true;
  }
}

interface Extracted {
  isEqualTo(position?: Position): boolean;
}`
      }
    ],
    async ({ code, selection = Selection.cursorAt(0, 0), expected }) => {
      const result = await doExtractInterface(code, selection);

      expect(result).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const selection = Selection.cursorAt(0, 0);

    await doExtractInterface(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundClassToExtractInterface
    );
  });

  async function doExtractInterface(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const editor = new InMemoryEditor(code);
    editor.showError = showErrorMessage;
    await extractInterface(code, selection, editor);
    return editor.code;
  }
});
