import * as t from "../../ast";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import {
  AbsolutePath,
  Code,
  ErrorReason,
  SelectedPosition
} from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { testEach } from "../../tests-helpers";

import { changeSignature, createVisitor } from "./change-signature";

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
        description: "when function call contains new lines",
        code: `function [cursor]add(a, b) {
            return a + b;
          }

          add(1,
            2);`,
        expected: `function add(b, a) {
            return a + b;
          }

          add(2,
            1);`
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
      },
      {
        description: "of a nested function",
        code: `function outer() {
          function [cursor]add(a, b) {
            return a + b;
          }

          return add(1, 2);
        }`,
        expected: `function outer() {
          function add(b, a) {
            return a + b;
          }

          return add(2, 1);
        }`
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

  it("Should order correctly for complex parameters with defaults values", async () => {
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

  testEach<{ code: Code; selection?: Selection }>(
    "should not show refactoring",
    [
      {
        description: "on an arrow function without parameters",
        code: `const add = () => {
          return 0;
        };`,
        selection: Selection.cursorAt(0, 13)
      },
      {
        description: "on an function without parameters",
        code: `function add() {
          return 0;
        }`,
        selection: Selection.cursorAt(0, 9)
      },
      {
        description: "on an class method without parameters",
        code: `class Math {
          add() {
            return 0;
          }
        }`,
        selection: Selection.cursorAt(1, 23)
      }
    ],
    ({ code, selection = Selection.cursorAt(0, 13) }) => {
      const ast = t.parse(code);
      let canConvert = false;
      t.traverseAST(
        ast,
        createVisitor(selection, () => (canConvert = true))
      );

      expect(canConvert).toBeFalsy();
    }
  );

  describe("Adding new parameter", () => {
    testEach<{
      code: Code;
      expected: Code;
      newValue: string;
    }>(
      "In same file",
      [
        {
          description: "is able to add <boolean> parameter in a function",
          newValue: "true",
          code: `function [cursor]add(a, b) {
            console.log(a, b)
          }

          add(7, "years");`,
          expected: `function add(a, b, newParam) {
            console.log(a, b)
          }

          add(7, "years", true);`
        },
        {
          description: "is able to add <number> parameter in a function",
          newValue: "120",
          code: `function [cursor]add(a, b) {
            console.log(a, b)
          }

          add(7, "years");`,
          expected: `function add(a, b, newParam) {
            console.log(a, b)
          }

          add(7, "years", 120);`
        },
        {
          description: "is able to add <array> parameter in a function",
          newValue: "[1, 2, 3]",
          code: `function [cursor]add(a, b) {
            console.log(a, b)
          }

          add(7, "years");`,
          expected: `function add(a, b, newParam) {
            console.log(a, b)
          }

          add(7, "years", [1, 2, 3]);`
        },
        {
          description:
            "is able to add <literal object> parameter in a function",
          newValue: "{ id: 1, name: 'Abracadabra' }",
          code: `function [cursor]add(a, b) {
            console.log(a, b)
          }

          add(7, "years");`,
          expected: `function add(a, b, newParam) {
            console.log(a, b)
          }

          add(7, "years", { id: 1, name: 'Abracadabra' });`
        },
        {
          description:
            "is able to add <instance class> parameter in a function",
          newValue: "new AbsolutePath('/temp/')",
          code: `function [cursor]add(a, b) {
            console.log(a, b)
          }

          add(7, "years");`,
          expected: `function add(a, b, newParam) {
            console.log(a, b)
          }

          add(7, "years", new AbsolutePath('/temp/'));`
        },
        {
          description: "is able to add <boolean> parameter in a class method",
          newValue: "true",
          code: `class Math {
            [cursor]add(a, b) {
              console.log(a, b)
            }
          }

          math.add(7, "years");`,
          expected: `class Math {
            add(a, b, newParam) {
              console.log(a, b)
            }
          }

          math.add(7, "years", true);`
        },
        {
          description: "is able to add <array> parameter in a class method",
          newValue: "[1, 2, 3]",
          code: `class Math {
            [cursor]add(a, b) {
              console.log(a, b)
            }
          }

          math.add(7, "years");`,
          expected: `class Math {
            add(a, b, newParam) {
              console.log(a, b)
            }
          }

          math.add(7, "years", [1, 2, 3]);`
        },
        {
          description: "is able to add <array> parameter in an arrow function",
          newValue: "[true]",
          code: `const add = [cursor](a, b) => {
            return a + b;
          }

          add(7, "years");`,
          expected: `const add = (a, b, newParam) => {
            return a + b;
          }

          add(7, "years", [true]);`
        }
      ],
      async ({ code, expected, newValue }) => {
        const path = new AbsolutePath("/temp/file.ts");
        const editor = new InMemoryEditor(code);
        await editor.writeIn(path, editor.code);
        editor.saveUserChoices(userChangePositionOf(0, 0));
        editor.saveUserChoices(userChangePositionOf(1, 1));
        editor.saveUserChoices(
          userChangePositionOf(-1, 2, "newParam", newValue)
        );

        await changeSignature(editor);

        const extracted = await editor.codeOf(path);
        expect(extracted).toBe(expected);
      }
    );
  });

  describe("Removing a parameter", () => {
    testEach<{
      code: Code;
      expected: Code;
    }>(
      "In same file",
      [
        {
          description: "is able to remove <boolean> parameter in a function",
          code: `function [cursor]add(a, b) {
            console.log(a)
          }

          add(7, true);`,
          expected: `function add(a) {
            console.log(a)
          }

          add(7);`
        },
        {
          description:
            "is able to remove <array> parameter with default value in a function",
          code: `function [cursor]add(a, b = []) {
            console.log(a)
          }

          add(7);`,
          expected: `function add(a) {
            console.log(a)
          }

          add(7);`
        },
        {
          description:
            "is able to remove <literal object> parameter in a function",
          code: `function [cursor]add(a, b) {
            console.log(a)
          }

          add(7, { id: 1, name: 'Abracadabra' });`,
          expected: `function add(a) {
            console.log(a)
          }

          add(7);`
        },
        {
          description:
            "is able to remove <instance class> parameter in a function",
          code: `function [cursor]add(a, b) {
            console.log(a)
          }

          add(7, new AbsolutePath('/temp/'));`,
          expected: `function add(a) {
            console.log(a)
          }

          add(7);`
        },
        {
          description:
            "is able to remove <boolean> parameter with default value in a class method",
          code: `class Math {
            [cursor]add(a, b = true) {
              console.log(a)
            }
          }

          math.add(7, "years");`,
          expected: `class Math {
            add(a) {
              console.log(a)
            }
          }

          math.add(7);`
        },
        {
          description:
            "is able to remove <array> parameter in an arrow function",
          code: `const add = [cursor](a, b) => {
            return a;
          }

          add(7, []);`,
          expected: `const add = a => {
            return a;
          }

          add(7);`
        }
      ],
      async ({ code, expected }) => {
        const path = new AbsolutePath("/temp/file.ts");
        const editor = new InMemoryEditor(code);
        await editor.writeIn(path, editor.code);
        editor.saveUserChoices(userChangePositionOf(0, 0));
        editor.saveUserChoices(userChangePositionOf(1, -1));

        await changeSignature(editor);

        const extracted = await editor.codeOf(path);
        expect(extracted).toBe(expected);
      }
    );

    it("Should be able to remove first parameter of a function with multiples parameters", async () => {
      const code = `function [cursor]add(a, b) {
            console.log(b)
          }

          add(7, { id: 1, name: 'Abracadabra' });`;
      const expected = `function add(b) {
            console.log(b)
          }

          add({ id: 1, name: 'Abracadabra' });`;

      const path = new AbsolutePath("/temp/file.ts");
      const editor = new InMemoryEditor(code);
      await editor.writeIn(path, editor.code);
      editor.saveUserChoices(userChangePositionOf(0, -1));
      editor.saveUserChoices(userChangePositionOf(1, 0));

      await changeSignature(editor);

      const extracted = await editor.codeOf(path);
      expect(extracted).toBe(expected);
    });

    it("Should be able to remove multiple parameters", async () => {
      const code = `function [cursor]add(a, b, paramOne, paramTwo) {
            console.log(a, b)
          }

          add(7, 8, -9, -99);`;
      const expected = `function add(a, b) {
            console.log(a, b)
          }

          add(7, 8);`;

      const path = new AbsolutePath("/temp/file.ts");
      const editor = new InMemoryEditor(code);
      await editor.writeIn(path, editor.code);
      editor.saveUserChoices(userChangePositionOf(0, 0));
      editor.saveUserChoices(userChangePositionOf(1, 1));
      editor.saveUserChoices(userChangePositionOf(2, -1));
      editor.saveUserChoices(userChangePositionOf(3, -1));

      await changeSignature(editor);

      const extracted = await editor.codeOf(path);
      expect(extracted).toBe(expected);
    });
  });

  it("Should be able to combine add new parameters and remove some", async () => {
    const code = `function [cursor]add(a, b, c) {
            console.log(b)
          }

          add(7, { id: 1, name: 'Abracadabra' }, [1]);`;
    const expected = `function add(b, newParam) {
            console.log(b)
          }

          add({ id: 1, name: 'Abracadabra' }, true);`;

    const path = new AbsolutePath("/temp/file.ts");
    const editor = new InMemoryEditor(code);
    await editor.writeIn(path, editor.code);
    editor.saveUserChoices(userChangePositionOf(0, -1, "a"));
    editor.saveUserChoices(userChangePositionOf(1, 0, "b"));
    editor.saveUserChoices(userChangePositionOf(2, -1, "c"));
    editor.saveUserChoices(userChangePositionOf(-1, 1, "newParam", "true"));

    await changeSignature(editor);

    const extracted = await editor.codeOf(path);
    expect(extracted).toBe(expected);
  });
});

function userChangePositionOf(
  startAt: number,
  endAt: number,
  label = "irrelevant",
  value?: string
): SelectedPosition {
  const result: SelectedPosition = {
    label,
    value: {
      startAt,
      endAt
    }
  };

  if (value) result.value.val = value;

  return result;
}
