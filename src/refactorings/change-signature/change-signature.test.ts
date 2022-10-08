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
          path: new RelativePath("./aFileWitoutReferences.ts")
        },
        expected: {
          currentFile: `function add(b, a) {
            return a + b;
          }`,
          otherFile: ""
        }
      },
      {
        description: "of a defined function with references in same file",
        setup: {
          currentFile: `function [cursor]add(a, b) {
            return a + b;
          }

          add(1, 2);`,
          otherFile: "",
          path: new RelativePath("./aFileWithReferencesInsideSameFile.ts")
        },
        expected: {
          currentFile: `function add(b, a) {
            return a + b;
          }

          add(2, 1);`,
          otherFile: ""
        }
      },
      {
        description:
          "of a defined function with multiple references in same file",
        setup: {
          currentFile: `function [cursor]add(a, b) {
            return a + b;
          }

          add(1, 2);
          add(3, 4);
          add(5, 6);
          add(7, 8);`,
          otherFile: "",
          path: new RelativePath("./aFileWithReferencesInsideSameFile.ts")
        },
        expected: {
          currentFile: `function add(b, a) {
            return a + b;
          }

          add(2, 1);
          add(4, 3);
          add(6, 5);
          add(8, 7);`,
          otherFile: ""
        }
      },
      {
        description:
          "of a defined function with multiple references in a conditions in same file",
        setup: {
          currentFile: `function [cursor]add(a, b) {
            return a + b;
          }

          if(add(1, 2)) {
            switch(add(3, 4)) {
              case 7:
                console.log('Inside');
            };
          }
          add(7, 8);`,
          otherFile: "",
          path: new RelativePath("./aFileWithReferencesInsideSameFile.ts")
        },
        expected: {
          currentFile: `function add(b, a) {
            return a + b;
          }

          if(add(2, 1)) {
            switch(add(4, 3)) {
              case 7:
                console.log('Inside');
            };
          }
          add(8, 7);`,
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
