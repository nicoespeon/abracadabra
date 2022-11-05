import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { AbsolutePath, Code, ErrorReason } from "../../editor/editor";
import { testEach } from "../../tests-helpers";

import { changeSignature } from "./change-signature";

type TestSample = {
  code: Code;
  path: AbsolutePath;
};

describe("Change Signature", () => {
  testEach<{
    code: Code;
    expected: Code;
  }>(
    "In the same file with function declarations",
    [
      {
        description: "when there are a function without references",
        code: `function [cursor]add(a, b) {
            return a + b;
          }`,
        expected: `function add(b, a) {
            return a + b;
          }`
      },
      {
        description: "when there are a defined function with references",
        code: `function [cursor]add(a, b) {
            return a + b;
          }

          add(1, 2);`,
        expected: `function add(b, a) {
            return a + b;
          }

          add(2, 1);`
      },
      {
        description:
          "only wanted function keeping contract of the rest of functions",
        code: `function [cursor]add(a, b) {
            return a + b;
          }

          add(2, 3);

          function subtract(a, b) {
            return a - b;
          }

          subtract(1, 2);
          `,
        expected: `function add(b, a) {
            return a + b;
          }

          add(3, 2);

          function subtract(a, b) {
            return a - b;
          }

          subtract(1, 2);
          `
      },
      {
        description:
          "when there are a defined function with multiples references",
        code: `function [cursor]add(a, b) {
            return a + b;
          }

          add(1, 2);
          add(3, 4);
          add(5, 6);
          add(7, 8);`,
        expected: `function add(b, a) {
            return a + b;
          }

          add(2, 1);
          add(4, 3);
          add(6, 5);
          add(8, 7);`
      },
      {
        description:
          "when there are a defined function with multiple references in a conditions",
        code: `function [cursor]add(a, b) {
            return a + b;
          }

          if(add(1, 2)) {
            switch(add(3, 4)) {
              case 7:
                console.log('Inside');
            };
          }
          add(7, 8);`,
        expected: `function add(b, a) {
            return a + b;
          }

          if(add(2, 1)) {
            switch(add(4, 3)) {
              case 7:
                console.log('Inside');
            };
          }
          add(8, 7);`
      },
      {
        description: "when has a destructuring param",
        code: `function [cursor]add(a, {item}) {
            return a + item;
          }

          add(7, {item: 1});`,
        expected: `function add({item}, a) {
            return a + item;
          }

          add({item: 1}, 7);`
      },
      {
        description: "with types in a ts code",
        code: `function [cursor]add(a: number, str: string) {
            return a + item;
          }

          add(7, " years");`,
        expected: `function add(str: string, a: number) {
            return a + item;
          }

          add(" years", 7);`
      },
      {
        description: "with default values in parameters",
        code: `function [cursor]add(a = 1, str = "Adios") {
            return a + str;
          }

          add(7, " years");
          add(1);`,
        expected: `function add(str = "Adios", a = 1) {
            return a + str;
          }

          add(" years", 7);
          add(undefined, 1);`
      },
      {
        description: "in a ts code with default parameters and types",
        code: `function [cursor]add(a: number = 1, str: string = "Adios") {
            return a + item;
          }

          add(7, " years");
          add();
          add(1);`,
        expected: `function add(str: string = "Adios", a: number = 1) {
            return a + item;
          }

          add(" years", 7);
          add();
          add(undefined, 1);`
      }
    ],
    async ({ code, expected }) => {
      const path = new AbsolutePath("/temp/aFile.ts");
      const editor = new InMemoryEditor(code);
      await editor.writeIn(path, editor.code);
      editor.saveUserChoices(userChangePositionOf(0, 1));
      editor.saveUserChoices(userChangePositionOf(1, 0));

      await changeSignature(editor);

      const extracted = await editor.codeOf(path);
      expect(extracted).toBe(expected);
    }
  );

  testEach<{
    code: Code;
    expected: Code;
  }>(
    "In the same file with arrow function declarations",
    [
      {
        description: "when there is an arrow function without references",
        code: `const add = [cursor](a, b) => {
            return a + b;
          }`,
        expected: `const add = (b, a) => {
            return a + b;
          }`
      },
      {
        description: "when there is an arrow function with references",
        code: `const add = [cursor](a, b) => {
            return a + b;
          }
          add(1, 2);
          `,
        expected: `const add = (b, a) => {
            return a + b;
          }
          add(2, 1);
          `
      },
      {
        description:
          "when there is a defined arrow function in multiple lines with references",
        code: `const add = [cursor](
          a,
          b) => {
            return a + b;
          }
          add(1, 2);
          `,
        expected: `const add = (
          b,
          a) => {
            return a + b;
          }
          add(2, 1);
          `
      }
    ],
    async ({ code, expected }) => {
      const path = new AbsolutePath("/temp/aFile.ts");
      const editor = new InMemoryEditor(code);
      await editor.writeIn(path, editor.code);
      editor.saveUserChoices(userChangePositionOf(0, 1));
      editor.saveUserChoices(userChangePositionOf(1, 0));

      await changeSignature(editor);

      const extracted = await editor.codeOf(path);
      expect(extracted).toBe(expected);
    }
  );

  testEach<{
    code: Code;
    expected: Code;
  }>(
    "In same file with class methods",
    [
      {
        description: "when there are a class without references",
        code: `class Maths {
        [cursor]add(a, b) {
          return a + b;
        }
      }`,
        expected: `class Maths {
        add(b, a) {
          return a + b;
        }
      }`
      },
      {
        description: "when there are a class with method references",
        code: `class Maths {
        [cursor]add(a, b) {
          return a + b;
        }
      }
      const maths = new Maths();
      maths.add(1, 2);`,
        expected: `class Maths {
        add(b, a) {
          return a + b;
        }
      }
      const maths = new Maths();
      maths.add(2, 1);`
      }
    ],
    async ({ code, expected }) => {
      const path = new AbsolutePath("/temp/aFile.ts");
      const editor = new InMemoryEditor(code);
      await editor.writeIn(path, editor.code);
      editor.saveUserChoices(userChangePositionOf(0, 1));
      editor.saveUserChoices(userChangePositionOf(1, 0));

      await changeSignature(editor);

      const extracted = await editor.codeOf(path);
      expect(extracted).toBe(expected);
    }
  );

  describe("Modules", () => {
    const addModule = new AbsolutePath("/temp/add.ts");
    const anotherModule = new AbsolutePath("/temp/anotherModule");

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
              path: new AbsolutePath("/temp/module.ts")
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
              path: new AbsolutePath("/temp/module.ts")
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
        },
        {
          description: "that import arrow function",
          setup: {
            currentFile: {
              code: `export const add = [cursor](a, b) => {
              return a + b;
            }`,
              path: new AbsolutePath("/temp/module.ts")
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
              code: `export const add = (b, a) => {
              return a + b;
            }`,
              path: new AbsolutePath("/temp/module.ts")
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
        editor.saveUserChoices(userChangePositionOf(0, 1));
        editor.saveUserChoices(userChangePositionOf(1, 0));
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
    await editor.writeIn(new AbsolutePath("/temp/aModule.js"), editor.code);
    jest.spyOn(editor, "showError");
    editor.saveUserChoices(userChangePositionOf(0, 1));
    editor.saveUserChoices(userChangePositionOf(1, 0));

    await changeSignature(editor);

    expect(editor.showError).toBeCalledWith(ErrorReason.CantChangeSignature);
  });

  it("Should order correclty for complex parameters with defaults values", async () => {
    const { setup, expected } = {
      setup: {
        currentFile: `function [cursor]add(a, str, {item}, [value = 1]) {
            console.log(a, str, item, value, args)
          }

          add(7, " years", {item: 3}, [1]);`,
        path: new AbsolutePath("/temp/aFileWithReferencesInsideSameFile.ts")
      },
      expected: {
        currentFile: `function add([value = 1], {item}, str, a) {
            console.log(a, str, item, value, args)
          }

          add([1], {item: 3}, " years", 7);`
      }
    };

    const editor = new InMemoryEditor(setup.currentFile);
    await editor.writeIn(setup.path, editor.code);
    editor.saveUserChoices(userChangePositionOf(0, 3));
    editor.saveUserChoices(userChangePositionOf(3, 0));
    editor.saveUserChoices(userChangePositionOf(1, 2));
    editor.saveUserChoices(userChangePositionOf(2, 1));

    await changeSignature(editor);

    const extracted = await editor.codeOf(setup.path);
    expect(extracted).toBe(expected.currentFile);
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

function userChangePositionOf(startAt: number, endAt: number) {
  return {
    label: "irrelevant",
    value: {
      startAt,
      endAt
    }
  };
}
