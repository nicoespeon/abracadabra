import { Code, RelativePath } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { changeSignature } from "./change-signature";

describe("Change Signature", () => {
  testEach<{
    setup: { currentFile: Code; otherFile: Code; path: RelativePath };
    expected: { currentFile: Code; otherFile: Code };
  }>(
    "should change signature",
    [
      {
        description: "of a defined function without references",
        setup: {
          currentFile: `function [cursor]add(a, b) {
            return a + b;
          }`,
          otherFile: "",
          path: new RelativePath("./other-file.ts")
        },
        expected: {
          currentFile: `function add(b, a) {
            return a + b;
          }`,
          otherFile: ""
        }
      }
    ],
    async ({ setup, expected }) => {
      const editor = new InMemoryEditor(setup.currentFile);
      await editor.writeIn(setup.path, editor.code);

      await changeSignature(editor);

      const extracted = await editor.codeOf(setup.path);
      expect(extracted).toBe(expected.currentFile);
    }
  );
});
