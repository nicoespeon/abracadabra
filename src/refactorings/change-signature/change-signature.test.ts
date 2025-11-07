import { assert } from "../../assert";
import * as t from "../../ast";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { AbsolutePath, Code, SelectedPosition } from "../../editor/editor";
import { changeSignature, createVisitor } from "./change-signature";
import { selectedPosition, swapBothArguments } from "./selected-position";

describe("Change Signature", () => {
  describe("in the same file with function declarations", () => {
    it("when there is a function without references", async () => {
      await shouldChangeSignature({
        code: `function [cursor]add(a, b) {
  return a + b;
}`,
        expected: `function add(b, a) {
  return a + b;
}`
      });
    });

    it("when there is a function with references", async () => {
      await shouldChangeSignature({
        code: `function [cursor]add(a, b) {
  return a + b;
}
add(1, 2);`,
        expected: `function add(b, a) {
  return a + b;
}
add(2, 1);`
      });
    });

    it("when function call contains new lines", async () => {
      await shouldChangeSignature({
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
      });
    });

    it("only wanted function keeping contract of the rest of functions", async () => {
      await shouldChangeSignature({
        code: `function [cursor]add(a, b) {
  return a + b;
}

add(2, 3);

function subtract(a, b) {
  return a - b;
}

subtract(1, 2);`,
        expected: `function add(b, a) {
  return a + b;
}

add(3, 2);

function subtract(a, b) {
  return a - b;
}

subtract(1, 2);`
      });
    });

    it("when there are a defined function with multiples references", async () => {
      await shouldChangeSignature({
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
      });
    });

    it("when there are a defined function with multiple references in a conditions", async () => {
      await shouldChangeSignature({
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
      });
    });

    it("when has a destructuring param", async () => {
      await shouldChangeSignature({
        code: `function [cursor]add(a, {item}) {
  return a + item;
}

add(7, {item: 1});`,
        expected: `function add({item}, a) {
  return a + item;
}

add({item: 1}, 7);`
      });
    });

    it("with types in a ts code", async () => {
      await shouldChangeSignature({
        code: `function [cursor]add(a: number, str: string) {
  return a + item;
}

add(7, " years");`,
        expected: `function add(str: string, a: number) {
  return a + item;
}

add(" years", 7);`
      });
    });

    it("with default values in parameters", async () => {
      await shouldChangeSignature({
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
      });
    });

    it("in a ts code with default parameters and types", async () => {
      await shouldChangeSignature({
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
      });
    });

    it("of a nested function", async () => {
      await shouldChangeSignature({
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
      });
    });
  });

  describe("in the same file with arrow function declarations", () => {
    it("when there is an arrow function without references", async () => {
      await shouldChangeSignature({
        code: `const add = [cursor](a, b) => {
  return a + b;
}`,
        expected: `const add = (b, a) => {
  return a + b;
}`
      });
    });

    it("when there is an arrow function with references", async () => {
      await shouldChangeSignature({
        code: `const add = [cursor](a, b) => {
  return a + b;
}
add(1, 2);`,
        expected: `const add = (b, a) => {
  return a + b;
}
add(2, 1);`
      });
    });

    it("when there is a defined arrow function in multiple lines with references", async () => {
      await shouldChangeSignature({
        code: `const add = [cursor](
a,
b) => {
  return a + b;
}
add(1, 2);`,
        expected: `const add = (
b,
a) => {
  return a + b;
}
add(2, 1);`
      });
    });
  });

  describe("in same file with class methods", () => {
    it("when there are a class without references", async () => {
      await shouldChangeSignature({
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
      });
    });

    it("when there are a class with method references", async () => {
      await shouldChangeSignature({
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
      });
    });
  });

  describe("adding new parameter", () => {
    it("is able to add <boolean> parameter in a function", async () => {
      await shouldChangeSignature({
        code: `function [cursor]add(a, b) {
  console.log(a, b)
}

add(7, "years");`,
        expected: `function add(a, b, newParam) {
  console.log(a, b)
}

add(7, "years", true);`,
        newPositions: [
          selectedPosition(0, 0),
          selectedPosition(1, 1),
          selectedPosition(-1, 2, "newParam", "true")
        ]
      });
    });

    it("is able to add <number> parameter in a function", async () => {
      await shouldChangeSignature({
        code: `function [cursor]add(a, b) {
  console.log(a, b)
}

add(7, "years");`,
        expected: `function add(a, b, newParam) {
  console.log(a, b)
}

add(7, "years", 120);`,
        newPositions: [
          selectedPosition(0, 0),
          selectedPosition(1, 1),
          selectedPosition(-1, 2, "newParam", "120")
        ]
      });
    });

    it("is able to add <array> parameter in a function", async () => {
      await shouldChangeSignature({
        code: `function [cursor]add(a, b) {
  console.log(a, b)
}

add(7, "years");`,
        expected: `function add(a, b, newParam) {
  console.log(a, b)
}

add(7, "years", [1, 2, 3]);`,
        newPositions: [
          selectedPosition(0, 0),
          selectedPosition(1, 1),
          selectedPosition(-1, 2, "newParam", "[1, 2, 3]")
        ]
      });
    });

    it("is able to add <literal object> parameter in a function", async () => {
      await shouldChangeSignature({
        code: `function [cursor]add(a, b) {
  console.log(a, b)
}

add(7, "years");`,
        expected: `function add(a, b, newParam) {
  console.log(a, b)
}

add(7, "years", { id: 1, name: 'Abracadabra' });`,
        newPositions: [
          selectedPosition(0, 0),
          selectedPosition(1, 1),
          selectedPosition(-1, 2, "newParam", "{ id: 1, name: 'Abracadabra' }")
        ]
      });
    });

    it("is able to add <instance class> parameter in a function", async () => {
      await shouldChangeSignature({
        code: `function [cursor]add(a, b) {
  console.log(a, b)
}

add(7, "years");`,
        expected: `function add(a, b, newParam) {
  console.log(a, b)
}

add(7, "years", new AbsolutePath('/temp/'));`,
        newPositions: [
          selectedPosition(0, 0),
          selectedPosition(1, 1),
          selectedPosition(-1, 2, "newParam", "new AbsolutePath('/temp/')")
        ]
      });
    });

    it("is able to add <boolean> parameter in a class method", async () => {
      await shouldChangeSignature({
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

math.add(7, "years", true);`,
        newPositions: [
          selectedPosition(0, 0),
          selectedPosition(1, 1),
          selectedPosition(-1, 2, "newParam", "true")
        ]
      });
    });

    it("is able to add <array> parameter in a class method", async () => {
      await shouldChangeSignature({
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

math.add(7, "years", [1, 2, 3]);`,
        newPositions: [
          selectedPosition(0, 0),
          selectedPosition(1, 1),
          selectedPosition(-1, 2, "newParam", "[1, 2, 3]")
        ]
      });
    });

    it("is able to add <array> parameter in an arrow function", async () => {
      await shouldChangeSignature({
        code: `const add = [cursor](a, b) => {
  return a + b;
}

add(7, "years");`,
        expected: `const add = (a, b, newParam) => {
  return a + b;
}

add(7, "years", [true]);`,
        newPositions: [
          selectedPosition(0, 0),
          selectedPosition(1, 1),
          selectedPosition(-1, 2, "newParam", "[true]")
        ]
      });
    });
  });

  describe("removing a parameter", () => {
    it("is able to remove <boolean> parameter in a function", async () => {
      await shouldChangeSignature({
        code: `function [cursor]add(a, b) {
  console.log(a)
}

add(7, true);`,
        expected: `function add(a) {
  console.log(a)
}

add(7);`,
        newPositions: [selectedPosition(0, 0), selectedPosition(1, -1)]
      });
    });

    it("is able to remove <array> parameter with default value in a function", async () => {
      await shouldChangeSignature({
        code: `function [cursor]add(a, b = []) {
  console.log(a)
}

add(7);`,
        expected: `function add(a) {
  console.log(a)
}

add(7);`,
        newPositions: [selectedPosition(0, 0), selectedPosition(1, -1)]
      });
    });

    it("is able to remove <literal object> parameter in a function", async () => {
      await shouldChangeSignature({
        code: `function [cursor]add(a, b) {
  console.log(a)
}

add(7, { id: 1, name: 'Abracadabra' });`,
        expected: `function add(a) {
  console.log(a)
}

add(7);`,
        newPositions: [selectedPosition(0, 0), selectedPosition(1, -1)]
      });
    });

    it("is able to remove <instance class> parameter in a function", async () => {
      await shouldChangeSignature({
        code: `function [cursor]add(a, b) {
  console.log(a)
}

add(7, new AbsolutePath('/temp/'));`,
        expected: `function add(a) {
  console.log(a)
}

add(7);`,
        newPositions: [selectedPosition(0, 0), selectedPosition(1, -1)]
      });
    });

    it("is able to remove <boolean> parameter with default value in a class method", async () => {
      await shouldChangeSignature({
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

math.add(7);`,
        newPositions: [selectedPosition(0, 0), selectedPosition(1, -1)]
      });
    });

    it("is able to remove <array> parameter in an arrow function", async () => {
      await shouldChangeSignature({
        code: `const add = [cursor](a, b) => {
  return a;
}

add(7, []);`,
        expected: `const add = a => {
  return a;
}

add(7);`,
        newPositions: [selectedPosition(0, 0), selectedPosition(1, -1)]
      });
    });

    it("should be able to remove first parameter of a function with multiples parameters", async () => {
      await shouldChangeSignature({
        code: `function [cursor]add(a, b) {
  console.log(b)
}

add(7, { id: 1, name: 'Abracadabra' });`,
        expected: `function add(b) {
  console.log(b)
}

add({ id: 1, name: 'Abracadabra' });`,
        newPositions: [selectedPosition(0, -1), selectedPosition(1, 0)]
      });
    });

    it("should be able to remove multiple parameters", async () => {
      await shouldChangeSignature({
        code: `function [cursor]add(a, b, paramOne, paramTwo) {
  console.log(a, b)
}

add(7, 8, -9, -99);`,
        expected: `function add(a, b) {
  console.log(a, b)
}

add(7, 8);`,
        newPositions: [
          selectedPosition(0, 0),
          selectedPosition(1, 1),
          selectedPosition(2, -1),
          selectedPosition(3, -1)
        ]
      });
    });
  });

  it("should order correctly for complex parameters with defaults values", async () => {
    await shouldChangeSignature({
      code: `function [cursor]add(a, str, {item}, [value = 1]) {
  console.log(a, str, item, value, args)
}

add(7, " years", {item: 3}, [1]);`,
      expected: `function add([value = 1], {item}, str, a) {
  console.log(a, str, item, value, args)
}

add([1], {item: 3}, " years", 7);`,
      newPositions: [
        selectedPosition(0, 3),
        selectedPosition(3, 0),
        selectedPosition(1, 2),
        selectedPosition(2, 1)
      ]
    });
  });

  it("should be able to combine add new parameters and remove some", async () => {
    await shouldChangeSignature({
      code: `function [cursor]add(a, b, c) {
  console.log(b)
}

add(7, { id: 1, name: 'Abracadabra' }, [1]);`,
      expected: `function add(b, newParam) {
  console.log(b)
}

add({ id: 1, name: 'Abracadabra' }, true);`,
      newPositions: [
        selectedPosition(0, -1, "a"),
        selectedPosition(1, 0, "b"),
        selectedPosition(2, -1, "c"),
        selectedPosition(-1, 1, "newParam", "true")
      ]
    });
  });

  describe("should not show refactoring", () => {
    it("on an arrow function without parameters", () => {
      shouldNotShowRefactoring(`const add = ([cursor]) => {
        return 0;
      };`);
    });

    it("on an function without parameters", () => {
      shouldNotShowRefactoring(`function add([cursor]) {
        return 0;
      }`);
    });

    it("on an class method without parameters", () => {
      shouldNotShowRefactoring(`class Math {
        add([cursor]) {
          return 0;
        }
      }`);
    });
  });

  it("should show an error message if refactoring can't be made because rest param should be the last", async () => {
    const code = `function [cursor]aFn(a, ...args) {
  return args.push(a);
}

aFn(0, 1);`;

    const editor = new InMemoryEditor(code);
    let result = changeSignature({
      state: "new",
      code: editor.code,
      selection: editor.selection,
      highlightSources: []
    });
    assert(
      result.action === "ask change signature positions",
      `Expected 'ask change signature positions' action, but got '${result.action}'`
    );

    await editor.writeIn(new AbsolutePath("/temp/aModule.js"), code);
    const references = await editor.getSelectionReferences(
      result.fixedSelection
    );
    result = changeSignature({
      state: "with user responses",
      code: editor.code,
      selection: editor.selection,
      highlightSources: [],
      responses: [
        {
          id: "change-signature-positions",
          type: "new positions",
          positions: swapBothArguments(),
          references: references.map((reference) => ({
            ...reference,
            code: editor.code
          }))
        }
      ]
    });

    expect(result.action).toBe("show error");
  });
});

async function shouldChangeSignature({
  code,
  expected,
  newPositions = swapBothArguments()
}: {
  code: Code;
  expected: Code;
  newPositions?: SelectedPosition[];
}) {
  const editor = new InMemoryEditor(code);
  const path = new AbsolutePath("/temp/aFile.ts");
  await editor.writeIn(path, editor.code);

  let result = changeSignature({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });
  assert(
    result.action === "ask change signature positions",
    `Expected 'ask change signature positions' action, but got '${result.action}'`
  );

  const references = await editor.getSelectionReferences(result.fixedSelection);
  result = changeSignature({
    state: "with user responses",
    code: editor.code,
    selection: editor.selection,
    highlightSources: [],
    responses: [
      {
        id: "change-signature-positions",
        type: "new positions",
        positions: newPositions,
        references: references.map((reference) => ({
          ...reference,
          code: editor.code
        }))
      }
    ]
  });

  expect(result).toMatchObject({
    action: "write all",
    updates: [{ path, code: expected }]
  });
}

function shouldNotShowRefactoring(code: Code) {
  const editor = new InMemoryEditor(code);
  const ast = t.parse(editor.code);

  let canConvert = false;
  t.traverseAST(
    ast,
    createVisitor(editor.selection, () => (canConvert = true))
  );

  expect(canConvert).toBeFalsy();
}
