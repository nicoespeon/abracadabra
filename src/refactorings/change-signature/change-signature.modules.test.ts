import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code } from "../../editor/editor";
import { AbsolutePath } from "../../editor/path";
import { testEach } from "../../tests-helpers";
import { changeSignature } from "./change-signature";
import { selectedPosition, swapBothArguments } from "./selected-position";

type TestSample = {
  code: Code;
  path: AbsolutePath;
};

describe("Change Signature: Modules", () => {
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
      },
      {
        description: "that import a class and use a method",
        setup: {
          currentFile: {
            code: `export class Maths {
                [cursor]add(a, b) {
                  return a + b;
                }
              }`,
            path: new AbsolutePath("/temp/module.ts")
          },
          otherFiles: [
            {
              code: `import {Maths} from './module';
                const maths = new Maths();
                maths.add(1, 2);
              `,
              path: addModule
            },
            {
              code: `import {add} from './anotherModule';
                export const calculateAdd = (a, b) => {
                  const maths = new Maths();
                  return maths.add(a, b);
                }
              `,
              path: anotherModule
            }
          ]
        },
        expected: {
          currentFile: {
            code: `export class Maths {
                add(b, a) {
                  return a + b;
                }
              }`,
            path: new AbsolutePath("/temp/module.ts")
          },
          otherFiles: [
            {
              code: `import {Maths} from './module';
                const maths = new Maths();
                maths.add(2, 1);
              `,
              path: addModule
            },
            {
              code: `import {add} from './anotherModule';
                export const calculateAdd = (a, b) => {
                  const maths = new Maths();
                  return maths.add(b, a);
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
      editor.replyWithPositions(swapBothArguments());
      await saveOtherFiles(setup, editor);

      await changeSignature(editor);

      const result = await editor.codeOf(setup.currentFile.path);
      expect(result).toBe(expected.currentFile.code);
      await validateOutput(expected, editor);
    }
  );

  describe("Adding parameter", () => {
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
      "should change signature of function with a reference in modules changing order and adding new one",
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
              code: `export function add(b, a, newParameter) {
              return a + b;
            }`,
              path: new AbsolutePath("/temp/module.ts")
            },
            otherFiles: [
              {
                code: `import {add} from './module';
                add(2, 1, 100)
              `,
                path: addModule
              },
              {
                code: `import {add} from './anotherModule';
                export const calculateAdd = (a, b) => {
                  return add(b, a, 100);
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
              code: `export const add = (b, a, newParameter) => {
              return a + b;
            }`,
              path: new AbsolutePath("/temp/module.ts")
            },
            otherFiles: [
              {
                code: `import {add} from './module';
                add(2, 1, 100)
              `,
                path: addModule
              },
              {
                code: `import {add} from './anotherModule';
                export const calculateAdd = (a, b) => {
                  return add(b, a, 100);
                }
              `,
                path: anotherModule
              }
            ]
          }
        },
        {
          description: "that import a class and use a method",
          setup: {
            currentFile: {
              code: `export class Maths {
                [cursor]add(a, b) {
                  return a + b;
                }
              }`,
              path: new AbsolutePath("/temp/module.ts")
            },
            otherFiles: [
              {
                code: `import {Maths} from './module';
                const maths = new Maths();
                maths.add(1, 2);
              `,
                path: addModule
              },
              {
                code: `import {add} from './anotherModule';
                export const calculateAdd = (a, b) => {
                  const maths = new Maths();
                  return maths.add(a, b);
                }
              `,
                path: anotherModule
              }
            ]
          },
          expected: {
            currentFile: {
              code: `export class Maths {
                add(b, a, newParameter) {
                  return a + b;
                }
              }`,
              path: new AbsolutePath("/temp/module.ts")
            },
            otherFiles: [
              {
                code: `import {Maths} from './module';
                const maths = new Maths();
                maths.add(2, 1, 100);
              `,
                path: addModule
              },
              {
                code: `import {add} from './anotherModule';
                export const calculateAdd = (a, b) => {
                  const maths = new Maths();
                  return maths.add(b, a, 100);
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
        editor.replyWithPositions([
          selectedPosition(0, 1),
          selectedPosition(1, 0),
          selectedPosition(-1, 2, "newParameter", "100")
        ]);
        await saveOtherFiles(setup, editor);

        await changeSignature(editor);

        const result = await editor.codeOf(setup.currentFile.path);
        expect(result).toBe(expected.currentFile.code);
        await validateOutput(expected, editor);
      }
    );
  });

  describe("Removing parameter", () => {
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
              return a;
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
              code: `export function add(a) {
              return a;
            }`,
              path: new AbsolutePath("/temp/module.ts")
            },
            otherFiles: [
              {
                code: `import {add} from './module';
                add(1)
              `,
                path: addModule
              },
              {
                code: `import {add} from './anotherModule';
                export const calculateAdd = (a, b) => {
                  return add(a);
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
              return a;
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
              code: `export const add = a => {
              return a;
            }`,
              path: new AbsolutePath("/temp/module.ts")
            },
            otherFiles: [
              {
                code: `import {add} from './module';
                add(1)
              `,
                path: addModule
              },
              {
                code: `import {add} from './anotherModule';
                export const calculateAdd = (a, b) => {
                  return add(a);
                }
              `,
                path: anotherModule
              }
            ]
          }
        },
        {
          description: "that import a class and use a method",
          setup: {
            currentFile: {
              code: `export class Maths {
                [cursor]add(a) {
                  return a;
                }
              }`,
              path: new AbsolutePath("/temp/module.ts")
            },
            otherFiles: [
              {
                code: `import {Maths} from './module';
                const maths = new Maths();
                maths.add(1, 2);
              `,
                path: addModule
              },
              {
                code: `import {add} from './anotherModule';
                export const calculateAdd = (a, b) => {
                  const maths = new Maths();
                  return maths.add(a, b);
                }
              `,
                path: anotherModule
              }
            ]
          },
          expected: {
            currentFile: {
              code: `export class Maths {
                add(a) {
                  return a;
                }
              }`,
              path: new AbsolutePath("/temp/module.ts")
            },
            otherFiles: [
              {
                code: `import {Maths} from './module';
                const maths = new Maths();
                maths.add(1);
              `,
                path: addModule
              },
              {
                code: `import {add} from './anotherModule';
                export const calculateAdd = (a, b) => {
                  const maths = new Maths();
                  return maths.add(a);
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
        editor.replyWithPositions([
          selectedPosition(0, 0),
          selectedPosition(1, -1)
        ]);
        await saveOtherFiles(setup, editor);

        await changeSignature(editor);

        const result = await editor.codeOf(setup.currentFile.path);
        expect(result).toBe(expected.currentFile.code);
        await validateOutput(expected, editor);
      }
    );
  });
});

function validateOutput(
  expected: { currentFile: TestSample; otherFiles: TestSample[] },
  editor: InMemoryEditor
) {
  const promises = expected.otherFiles.map(async (file) => {
    const result = await editor.codeOf(file.path);
    expect(result).toBe(file.code);
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
