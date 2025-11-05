import { assert } from "../../assert";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code, SelectedPosition } from "../../editor/editor";
import { AbsolutePath } from "../../editor/path";
import { changeSignature } from "./change-signature";
import { selectedPosition, swapBothArguments } from "./selected-position";

describe("Change Signature: Modules", () => {
  describe("should change signature of function with a reference in modules", () => {
    it("that import a function", async () => {
      await shouldChangeSignature([
        {
          path: new AbsolutePath("/temp/module.ts"),
          code: `export function [cursor]add(a, b) {
  return a + b;
}`,
          expected: `export function add(b, a) {
  return a + b;
}`
        },
        {
          path: new AbsolutePath("/temp/add.ts"),
          code: `import {add} from './module';
add(1, 2)`,
          expected: `import {add} from './module';
add(2, 1)`
        },
        {
          path: new AbsolutePath("/temp/anotherModule"),
          code: `import {add} from './anotherModule';
export const calculateAdd = (a, b) => {
  return add(a, b);
}`,
          expected: `import {add} from './anotherModule';
export const calculateAdd = (a, b) => {
  return add(b, a);
}`
        }
      ]);
    });

    it("that import an arrow function", async () => {
      await shouldChangeSignature([
        {
          path: new AbsolutePath("/temp/module.ts"),
          code: `export const add = [cursor](a, b) => {
  return a + b;
}`,
          expected: `export const add = (b, a) => {
  return a + b;
}`
        },
        {
          path: new AbsolutePath("/temp/add.ts"),
          code: `import {add} from './module';
add(1, 2)`,
          expected: `import {add} from './module';
add(2, 1)`
        },
        {
          path: new AbsolutePath("/temp/anotherModule"),
          code: `import {add} from './anotherModule';
export const calculateAdd = (a, b) => {
  return add(a, b);
}`,
          expected: `import {add} from './anotherModule';
export const calculateAdd = (a, b) => {
  return add(b, a);
}`
        }
      ]);
    });

    it("that import a class and use a method", async () => {
      await shouldChangeSignature([
        {
          path: new AbsolutePath("/temp/module.ts"),
          code: `export class Maths {
  [cursor]add(a, b) {
    return a + b;
  }
}`,
          expected: `export class Maths {
  add(b, a) {
    return a + b;
  }
}`
        },
        {
          path: new AbsolutePath("/temp/add.ts"),
          code: `import {Maths} from './module';
const maths = new Maths();
maths.add(1, 2);`,
          expected: `import {Maths} from './module';
const maths = new Maths();
maths.add(2, 1);`
        },
        {
          path: new AbsolutePath("/temp/anotherModule"),
          code: `import {Maths} from './anotherModule';
export const calculateAdd = (a, b) => {
  const maths = new Maths();
  return maths.add(a, b);
}`,
          expected: `import {Maths} from './anotherModule';
export const calculateAdd = (a, b) => {
  const maths = new Maths();
  return maths.add(b, a);
}`
        }
      ]);
    });
  });

  describe("Adding parameter", () => {
    describe("should change signature of function with a reference in modules adding new one", () => {
      it("that import a function", async () => {
        await shouldChangeSignature(
          [
            {
              path: new AbsolutePath("/temp/module.ts"),
              code: `export function [cursor]add(a, b) {
  return a + b;
}`,
              expected: `export function add(a, b, newParameter) {
  return a + b;
}`
            },
            {
              path: new AbsolutePath("/temp/add.ts"),
              code: `import {add} from './module';
add(1, 2)`,
              expected: `import {add} from './module';
add(1, 2, 100)`
            },
            {
              path: new AbsolutePath("/temp/anotherModule"),
              code: `import {add} from './anotherModule';
export const calculateAdd = (a, b) => {
  return add(a, b);
}`,
              expected: `import {add} from './anotherModule';
export const calculateAdd = (a, b) => {
  return add(a, b, 100);
}`
            }
          ],
          [
            selectedPosition(0, 0),
            selectedPosition(1, 1),
            selectedPosition(-1, 2, "newParameter", "100")
          ]
        );
      });

      it("that import an arrow function", async () => {
        await shouldChangeSignature(
          [
            {
              path: new AbsolutePath("/temp/module.ts"),
              code: `export const add = [cursor](a, b) => {
  return a + b;
}`,
              expected: `export const add = (a, b, newParameter) => {
  return a + b;
}`
            },
            {
              path: new AbsolutePath("/temp/add.ts"),
              code: `import {add} from './module';
add(1, 2)`,
              expected: `import {add} from './module';
add(1, 2, 100)`
            },
            {
              path: new AbsolutePath("/temp/anotherModule"),
              code: `import {add} from './anotherModule';
export const calculateAdd = (a, b) => {
  return add(a, b);
}`,
              expected: `import {add} from './anotherModule';
export const calculateAdd = (a, b) => {
  return add(a, b, 100);
}`
            }
          ],
          [
            selectedPosition(0, 0),
            selectedPosition(1, 1),
            selectedPosition(-1, 2, "newParameter", "100")
          ]
        );
      });
    });

    it("that import a class and use a method", async () => {
      await shouldChangeSignature(
        [
          {
            path: new AbsolutePath("/temp/module.ts"),
            code: `export class Maths {
  [cursor]add(a, b) {
    return a + b;
  }
}`,
            expected: `export class Maths {
  add(a, b, newParameter) {
    return a + b;
  }
}`
          },
          {
            path: new AbsolutePath("/temp/add.ts"),
            code: `import {Maths} from './module';
const maths = new Maths();
maths.add(1, 2);`,
            expected: `import {Maths} from './module';
const maths = new Maths();
maths.add(1, 2, 100);`
          },
          {
            path: new AbsolutePath("/temp/anotherModule"),
            code: `import {Maths} from './anotherModule';
export const calculateAdd = (a, b) => {
  const maths = new Maths();
  return maths.add(a, b);
}`,
            expected: `import {Maths} from './anotherModule';
export const calculateAdd = (a, b) => {
  const maths = new Maths();
  return maths.add(a, b, 100);
}`
          }
        ],
        [
          selectedPosition(0, 0),
          selectedPosition(1, 1),
          selectedPosition(-1, 2, "newParameter", "100")
        ]
      );
    });
  });

  describe("Removing parameter", () => {
    describe("should change signature of function with a reference in modules removing one", () => {
      it("that import a function", async () => {
        await shouldChangeSignature(
          [
            {
              path: new AbsolutePath("/temp/module.ts"),
              code: `export function [cursor]add(a, b) {
  return a;
}`,
              expected: `export function add(a) {
  return a;
}`
            },
            {
              path: new AbsolutePath("/temp/add.ts"),
              code: `import {add} from './module';
add(1, 2)`,
              expected: `import {add} from './module';
add(1)`
            },
            {
              path: new AbsolutePath("/temp/anotherModule"),
              code: `import {add} from './anotherModule';
export const calculateAdd = (a, b) => {
  return add(a, b);
}`,
              expected: `import {add} from './anotherModule';
export const calculateAdd = (a, b) => {
  return add(a);
}`
            }
          ],
          [selectedPosition(0, 0), selectedPosition(1, -1)]
        );
      });

      it("that import an arrow function", async () => {
        await shouldChangeSignature(
          [
            {
              path: new AbsolutePath("/temp/module.ts"),
              code: `export const add = [cursor](a, b) => {
  return a;
}`,
              expected: `export const add = a => {
  return a;
}`
            },
            {
              path: new AbsolutePath("/temp/add.ts"),
              code: `import {add} from './module';
add(1, 2)`,
              expected: `import {add} from './module';
add(1)`
            },
            {
              path: new AbsolutePath("/temp/anotherModule"),
              code: `import {add} from './anotherModule';
export const calculateAdd = (a, b) => {
  return add(a, b);
}`,
              expected: `import {add} from './anotherModule';
export const calculateAdd = (a, b) => {
  return add(a);
}`
            }
          ],
          [selectedPosition(0, 0), selectedPosition(1, -1)]
        );
      });

      it("that import a class and use a method", async () => {
        await shouldChangeSignature(
          [
            {
              path: new AbsolutePath("/temp/module.ts"),
              code: `export class Maths {
  [cursor]add(a, b) {
    return a;
  }
}`,
              expected: `export class Maths {
  add(a) {
    return a;
  }
}`
            },
            {
              path: new AbsolutePath("/temp/add.ts"),
              code: `import {Maths} from './module';
const maths = new Maths();
maths.add(1, 2);`,
              expected: `import {Maths} from './module';
const maths = new Maths();
maths.add(1);`
            },
            {
              path: new AbsolutePath("/temp/anotherModule"),
              code: `import {Maths} from './anotherModule';
export const calculateAdd = (a, b) => {
  const maths = new Maths();
  return maths.add(a, b);
}`,
              expected: `import {Maths} from './anotherModule';
export const calculateAdd = (a, b) => {
  const maths = new Maths();
  return maths.add(a);
}`
            }
          ],
          [selectedPosition(0, 0), selectedPosition(1, -1)]
        );
      });
    });
  });
});

async function shouldChangeSignature(
  files: { path: AbsolutePath; code: Code; expected: Code }[],
  newPositions: SelectedPosition[] = swapBothArguments()
) {
  const currentFile = files[0];

  const editor = new InMemoryEditor(currentFile.code);
  await Promise.all(
    files.map(async (file) => {
      await editor.writeIn(file.path, file.code);
    })
  );

  let result = changeSignature({
    state: "new",
    code: editor.code,
    selection: editor.selection
  });
  assert(
    result.action === "ask change signature positions",
    `Expected 'ask change signature positions' action, but got '${result.action}'`
  );

  const references = await editor.getSelectionReferences(result.fixedSelection);
  const referencesWithCode = references.map((reference) => {
    const file = files.find(({ path }) => path.equals(reference.path));
    const editor = new InMemoryEditor(file?.code ?? "");
    return {
      ...reference,
      code: editor.code
    };
  });
  result = changeSignature({
    state: "with user responses",
    code: editor.code,
    selection: editor.selection,
    responses: [
      {
        id: "change-signature-positions",
        type: "new positions",
        positions: newPositions,
        references: referencesWithCode
      }
    ]
  });

  expect(result).toMatchObject({
    action: "write all",
    updates: files.map((file) => ({
      path: file.path,
      code: file.expected
    }))
  });
}
