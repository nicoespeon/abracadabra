import { ErrorReason, Code, Path } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { moveToExistingFile } from "./move-to-existing-file";

describe("Move To Existing File", () => {
  testEach<{
    setup: { currentFile: Code; otherFile: Code; relativePath: Path };
    expected: { currentFile: Code; otherFile: Code };
  }>(
    "should move to existing file",
    [
      {
        description: "a root-level function declaration",
        setup: {
          currentFile: `function [cursor]doNothing() {}
doNothing();`,
          otherFile: "",
          relativePath: new Path("./other-file.ts")
        },
        expected: {
          currentFile: `import { doNothing } from "./other-file";
doNothing();`,
          otherFile: `export function doNothing() {}`
        }
      }
    ],
    async ({ setup, expected }) => {
      const editor = new InMemoryEditor(setup.currentFile);
      editor.writeIn(setup.relativePath, setup.otherFile);

      await moveToExistingFile(editor);

      expect(editor.code).toBe(expected.currentFile);
      const otherFileCode = await editor.codeOf(setup.relativePath);
      expect(otherFileCode).toBe(expected.otherFile);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    editor.writeIn(new Path("./some-other-file.ts"), "");
    jest.spyOn(editor, "showError");

    await moveToExistingFile(editor);

    expect(editor.showError).toBeCalledWith(ErrorReason.DidNotFindCodeToMove);
  });
});
