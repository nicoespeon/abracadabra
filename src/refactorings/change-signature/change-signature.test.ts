import { Code, ErrorReason, RelativePath } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { changeSignature } from "./change-signature";

type TestSample = {
  code: Code;
  path: RelativePath;
};

describe("Change Signature", () => {
  testEach<{
    setup: { currentFile: Code; path: RelativePath };
    expected: { currentFile: Code };
  }>(
    "In same file",
    [
      {
        description: "when there are a function without references",
        setup: {
          currentFile: `function [cursor]add(a, b) {
            return a + b;
          }`,
          path: new RelativePath("./aFileWitoutReferences.ts")
        },
        expected: {
          currentFile: `function add(b, a) {
            return a + b;
          }`
        }
      },
      {
        description: "when there are a defined function with references",
        setup: {
          currentFile: `function [cursor]add(a, b) {
            return a + b;
          }

          add(1, 2);`,
          path: new RelativePath("./aFileWithReferencesInsideSameFile.ts")
        },
        expected: {
          currentFile: `function add(b, a) {
            return a + b;
          }

          add(2, 1);`
        }
      },
      {
        description:
          "when there are a defined function with multiples references",
        setup: {
          currentFile: `function [cursor]add(a, b) {
            return a + b;
          }

          add(1, 2);
          add(3, 4);
          add(5, 6);
          add(7, 8);`,
          path: new RelativePath("./aFileWithReferencesInsideSameFile.ts")
        },
        expected: {
          currentFile: `function add(b, a) {
            return a + b;
          }

          add(2, 1);
          add(4, 3);
          add(6, 5);
          add(8, 7);`
        }
      },
      {
        description:
          "when there are a defined function with multiple references in a conditions",
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
          add(8, 7);`
        }
      },
      {
        description: "when has a destructuring param",
        setup: {
          currentFile: `function [cursor]add(a, {item}) {
            return a + item;
          }

          add(7, {item: 1});`,
          path: new RelativePath("./aFileWithReferencesInsideSameFile.ts")
        },
        expected: {
          currentFile: `function add({item}, a) {
            return a + item;
          }

          add({item: 1}, 7);`
        }
      },
      {
        description: "with types in a ts code",
        setup: {
          currentFile: `function [cursor]add(a: number, str: string) {
            return a + item;
          }

          add(7, " years");`,
          path: new RelativePath("./aFileWithReferencesInsideSameFile.ts")
        },
        expected: {
          currentFile: `function add(str: string, a: number) {
            return a + item;
          }

          add(" years", 7);`
        }
      },
      {
        description: "with default values in parameters",
        setup: {
          currentFile: `function [cursor]add(a = 1, str = "Adios") {
            return a + str;
          }

          add(7, " years");
          add(1);`,
          path: new RelativePath("./aFileWithReferencesInsideSameFile.ts")
        },
        expected: {
          currentFile: `function add(str = "Adios", a = 1) {
            return a + str;
          }

          add(" years", 7);
          add(undefined, 1);`
        }
      },
      {
        description: "in a ts code with default parameters and types",
        setup: {
          currentFile: `function [cursor]add(a: number = 1, str: string = "Adios") {
            return a + item;
          }

          add(7, " years");
          add();
          add(1);`,
          path: new RelativePath("./aFileWithReferencesInsideSameFile.ts")
        },
        expected: {
          currentFile: `function add(str: string = "Adios", a: number = 1) {
            return a + item;
          }

          add(" years", 7);
          add();
          add(undefined, 1);`
        }
      }
    ],
    async ({ setup, expected }) => {
      const editor = new InMemoryEditor(setup.currentFile);
      await editor.writeIn(setup.path, editor.code);
      editor.saveUserChoices(userChangePositionOf("a", 0, 1));
      editor.saveUserChoices(userChangePositionOf("b", 1, 0));

      await changeSignature(editor);

      const extracted = await editor.codeOf(setup.path);
      expect(extracted).toBe(expected.currentFile);
    }
  );

  describe("Modules", () => {
    const addModule = new RelativePath("./add.ts");
    const anotherModule = new RelativePath("./anotherModule");

    testEach<{
      setup: {
        currentFile: TestSample;
        otherFiles: TestSample[];
      };
      expected: {
        currentFile: TestSample;
        otherFiles: TestSample[];
      };
    }>(
      "should change signature of function with a reference in modules",
      [
        {
          description: "that import the function",
          setup: {
            currentFile: {
              code: `export function [cursor]add(a, b) {
              return a + b;
            }`,
              path: new RelativePath("./module.ts")
            },
            otherFiles: [
              {
                code: `import {add} from './module';
                add(1, 2)
              `,
                path: addModule
              },
              {
                code: `import {add} from './anotherModule';
                export const calculateAdd = (a, b) => {
                  return add(a, b);
                }
              `,
                path: anotherModule
              }
            ]
          },
          expected: {
            currentFile: {
              code: `export function add(b, a) {
              return a + b;
            }`,
              path: new RelativePath("./module.ts")
            },
            otherFiles: [
              {
                code: `import {add} from './module';
                add(2, 1)
              `,
                path: addModule
              },
              {
                code: `import {add} from './anotherModule';
                export const calculateAdd = (a, b) => {
                  return add(b, a);
                }
              `,
                path: anotherModule
              }
            ]
          }
        }
      ],
      async ({ setup, expected }) => {
        const editor = new InMemoryEditor(setup.currentFile.code);
        await editor.writeIn(setup.currentFile.path, editor.code);
        editor.saveUserChoices(userChangePositionOf("a", 0, 1));
        editor.saveUserChoices(userChangePositionOf("b", 1, 0));
        await saveOtherFiles(setup, editor);

        await changeSignature(editor);

        const extracted = await editor.codeOf(setup.currentFile.path);
        expect(extracted).toBe(expected.currentFile.code);
        await validateOutput(expected, editor);
      }
    );
  });

  it("should show an error message if refactoring can't be made because rest param should be the last", async () => {
    const code = `
    function [cursor]aFn(a, ...args) {
      return args.push(a);
    }

    aFn(0, 1);
    `;
    const editor = new InMemoryEditor(code);
    await editor.writeIn(new RelativePath("aModule.js"), editor.code);
    jest.spyOn(editor, "showError");
    editor.saveUserChoices(userChangePositionOf("a", 0, 1));
    editor.saveUserChoices(userChangePositionOf("args", 1, 0));

    await changeSignature(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.CantChangeSignatureException
    );
  });
});

function validateOutput(
  expected: { currentFile: TestSample; otherFiles: TestSample[] },
  editor: InMemoryEditor
) {
  const promises = expected.otherFiles.map(async (file) => {
    const extracted = await editor.codeOf(file.path);
    expect(extracted).toBe(file.code);
  });

  return Promise.all(promises);
}

function saveOtherFiles(
  setup: {
    currentFile: TestSample;
    otherFiles: TestSample[];
  },
  editor: InMemoryEditor
) {
  const promises = setup.otherFiles.map(async (file) => {
    await editor.writeIn(file.path, file.code);
  });

  return Promise.all(promises);
}

function userChangePositionOf(param: string, startAt: number, endAt: number) {
  return {
    label: param,
    value: {
      startAt,
      endAt
    }
  };
}
