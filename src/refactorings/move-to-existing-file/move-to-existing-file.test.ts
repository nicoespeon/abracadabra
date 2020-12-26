import { ErrorReason, Code, RelativePath } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { moveToExistingFile } from "./move-to-existing-file";

describe("Move To Existing File", () => {
  testEach<{
    setup: { currentFile: Code; otherFile: Code; path: RelativePath };
    expected: { currentFile: Code; otherFile: Code };
  }>(
    "should move to existing file",
    [
      {
        description: "a root-level function declaration",
        setup: {
          currentFile: `import { someValue } from "lib";

function [cursor]doNothing() {}

doNothing();`,
          otherFile: "",
          path: new RelativePath("./other-file.ts")
        },
        expected: {
          currentFile: `import { doNothing } from "./other-file";
import { someValue } from "lib";

doNothing();`,
          otherFile: `export function doNothing() {}`
        }
      },
      {
        description: "in another file with exports already",
        setup: {
          currentFile: `function [cursor]doNothing() {}
doNothing();`,
          otherFile: `function doSomething() {}

export { doSomething }`,
          path: new RelativePath("./other-file.ts")
        },
        expected: {
          currentFile: `import { doNothing } from "./other-file";
doNothing();`,
          otherFile: `function doSomething() {}

export { doSomething }
export function doNothing() {}`
        }
      }
    ],
    async ({ setup, expected }) => {
      const editor = new InMemoryEditor(setup.currentFile);
      editor.writeIn(setup.path, setup.otherFile);

      await moveToExistingFile(editor);

      expect(editor.code).toBe(expected.currentFile);
      const otherFileCode = await editor.codeOf(setup.path);
      expect(otherFileCode).toBe(expected.otherFile);
    }
  );

  testEach<{ code: Code }>(
    "should not move",
    [
      {
        description: "if cursor is inside function body",
        code: `function sayHello() {[cursor]
  console.log("hello");
}

sayHello();`
      },
      {
        description: "a nested function declaration",
        code: `function doSomething() {
  function [cursor]doNothing() {}

  doNothing();
}`
      }
    ],
    async ({ code }) => {
      const editor = new InMemoryEditor(code);
      const originalCode = editor.code;
      const otherFile = new RelativePath("./other-file.ts");
      editor.writeIn(otherFile, "// No change expected");

      await moveToExistingFile(editor);

      expect(editor.code).toBe(originalCode);
      const otherFileCode = await editor.codeOf(otherFile);
      expect(otherFileCode).toBe("// No change expected");
    }
  );

  it("should ask user to select among other files", async () => {
    const code = `function [cursor]doSomething() {}`;
    const editor = new InMemoryEditor(code);
    editor.writeIn(new RelativePath("./some-other-file.ts"), "");
    editor.writeIn(new RelativePath("./yet-another-file.js"), "");
    editor.writeIn(new RelativePath("../../another-react-file.tsx"), "");
    editor.writeIn(new RelativePath("./yet-another-react-file.jsx"), "");
    jest.spyOn(editor, "askUserChoice");

    await moveToExistingFile(editor);

    expect(editor.askUserChoice).toBeCalledWith(
      [
        expect.objectContaining({ label: "some-other-file.ts" }),
        expect.objectContaining({ label: "yet-another-file.js" }),
        expect.objectContaining({ label: "another-react-file.tsx" }),
        expect.objectContaining({ label: "yet-another-react-file.jsx" })
      ],
      "Search files by name and pick one"
    );
  });

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    editor.writeIn(new RelativePath("./some-other-file.ts"), "");
    jest.spyOn(editor, "showError");

    await moveToExistingFile(editor);

    expect(editor.showError).toBeCalledWith(ErrorReason.DidNotFindCodeToMove);
  });

  it("should show an error message if there's no other file in the workspace", async () => {
    const code = `function [cursor]doSomething() {}`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await moveToExistingFile(editor);

    expect(editor.showError).toBeCalledWith(ErrorReason.DidNotFindOtherFiles);
  });
});
