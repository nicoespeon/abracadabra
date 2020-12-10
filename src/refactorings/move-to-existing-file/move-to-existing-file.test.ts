import { ErrorReason, Code } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { moveToExistingFile } from "./move-to-existing-file";

describe("Move To Existing File", () => {
  testEach<{
    currentFile: { code: Code; expected: Code };
    otherFile: { relativePath: string; code: Code; expected: Code };
  }>(
    "should move to existing file",
    [
      {
        description: "a root-level function declaration",
        currentFile: {
          code: `function [cursor]doNothing() {}
doNothing();`,
          expected: `import { doNothing } from "./other-file";
doNothing();`
        },
        otherFile: {
          relativePath: "./other-file",
          code: ``,
          expected: `export function doNothing() {}`
        }
      }
    ],
    async ({ currentFile, otherFile }) => {
      const editor = new InMemoryEditor(currentFile.code);
      editor.createOtherFile(otherFile.relativePath, otherFile.code);

      await moveToExistingFile(editor);

      expect(editor.code).toBe(currentFile.expected);
      expect(editor.codeOf(otherFile.relativePath)).toBe(otherFile.expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await moveToExistingFile(editor);

    expect(editor.showError).toBeCalledWith(ErrorReason.DidNotFindCodeToMove);
  });
});
