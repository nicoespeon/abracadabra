import { Editor, Code } from "./editor";
import { Position } from "./position";
import { Selection } from "./selection";

export { createEditorContractTests };

/**
 * This is a contract tests factory.
 *
 * It verifies that an adapter of the `Editor` interface works as expected.
 * When you write an adapter, use this factory to generate the tests.
 *
 * The factory ask you to provide a way to call the implementation
 * on a given code, and to retrieve the updated code.
 *
 * Benefits of such technique:
 * - It tells you if your adapter works as expected by the code
 * - It tells you if everything still work when you upgrade the adapter
 */

function createEditorContractTests(
  createEditorOn: (
    code: Code,
    position?: Position
  ) => [Editor, () => { code: Code; position: Position }]
) {
  describe("write", () => {
    it("should update code with the given one", async () => {
      const code = `function sayHello() {
  // Replace me with some code
}`;
      const newCode = `function sayHi() {
  console.log("Hello");
  console.log("How are you doing?");
}`;

      const [editor, getState] = createEditorOn(code);
      await editor.write(newCode);

      expect(getState().code).toEqual(newCode);
    });

    it("should set position to the given one", async () => {
      const code = `function sayHello() {
  // Replace me with some code
}`;
      const newCode = `function sayHi() {
  console.log("Hello");
  console.log("How are you doing?");
}`;
      const newPosition = new Position(2, 3);

      const [editor, getState] = createEditorOn(code);
      await editor.write(newCode, newPosition);

      expect(getState().position).toEqual(newPosition);
    });

    it("should default to initial position if no position is given", async () => {
      const code = `function sayHello() {
  // Replace me with some code
}`;
      const newCode = `function sayHi() {
  console.log("Hello");
  console.log("How are you doing?");
}`;
      const position = new Position(0, 1);

      const [editor, getState] = createEditorOn(code, position);
      await editor.write(newCode);

      expect(getState().position).toEqual(position);
    });
  });

  describe("readThenWrite", () => {
    it("should call `getModifications()` with an empty string if given selection is a cursor", async () => {
      const code = `console.log("Hello")`;
      const getModifications = jest.fn().mockReturnValue([]);

      const [editor] = createEditorOn(code);
      await editor.readThenWrite(Selection.cursorAt(0, 0), getModifications);

      expect(getModifications).toBeCalledWith("");
    });

    it("should call `getModifications()` with the result of given selection", async () => {
      const code = `console.log("Hello")`;
      const getModifications = jest.fn().mockReturnValue([]);

      const [editor] = createEditorOn(code);
      await editor.readThenWrite(
        new Selection([0, 13], [0, 18]),
        getModifications
      );

      expect(getModifications).toBeCalledWith("Hello");
    });

    it("should call `getModifications()` with the result of given multi-lines selection", async () => {
      const code = `function sayHello() {
  console.log("Hello");
}`;
      const getModifications = jest.fn().mockReturnValue([]);

      const [editor] = createEditorOn(code);
      await editor.readThenWrite(
        new Selection([0, 9], [2, 1]),
        getModifications
      );

      expect(getModifications).toBeCalledWith(`sayHello() {
  console.log("Hello");
}`);
    });

    it("should not change given code if no updates are given", async () => {
      const code = `console.log("Hello")`;

      const [editor, getState] = createEditorOn(code);
      await editor.readThenWrite(Selection.cursorAt(0, 0), () => []);

      expect(getState().code).toEqual(code);
    });

    it("should apply update at cursor", async () => {
      const code = `console.log("Hello")`;

      const [editor, getState] = createEditorOn(code);
      await editor.readThenWrite(Selection.cursorAt(0, 0), () => [
        { code: " World!", selection: Selection.cursorAt(0, 18) }
      ]);

      expect(getState().code).toEqual(`console.log("Hello World!")`);
    });

    it("should use read code to update code", async () => {
      const code = `console.log("Hello")`;

      const [editor, getState] = createEditorOn(code);
      await editor.readThenWrite(
        new Selection([0, 13], [0, 18]),
        (readCode) => [
          {
            code: `${readCode} you!`,
            selection: new Selection([0, 13], [0, 18])
          }
        ]
      );

      expect(getState().code).toEqual(`console.log("Hello you!")`);
    });

    it("should apply update instead of selection", async () => {
      const code = `function sayHello() {
  console.log("Hello");
}`;

      const [editor, getState] = createEditorOn(code);
      await editor.readThenWrite(Selection.cursorAt(0, 0), () => [
        { code: `logger`, selection: new Selection([1, 2], [1, 13]) }
      ]);

      expect(getState().code).toEqual(`function sayHello() {
  logger("Hello");
}`);
    });

    it("should preserve empty lines", async () => {
      const code = `console.log("Hello");

  console.log("World!");`;

      const [editor, getState] = createEditorOn(code);
      await editor.readThenWrite(Selection.cursorAt(0, 0), () => [
        {
          code: `console.log("Goodbye");`,
          selection: new Selection([0, 0], [0, 21])
        }
      ]);

      expect(getState().code).toEqual(`console.log("Goodbye");

  console.log("World!");`);
    });

    it("should apply update instead of multi-line selection", async () => {
      const code = `function sayHello() {
  console.log("Hello");
  console.log("World");
  console.log("Boooh!");
}`;

      const [editor, getState] = createEditorOn(code);
      await editor.readThenWrite(Selection.cursorAt(0, 0), () => [
        {
          code: `console.log("Hello World!");`,
          selection: new Selection([1, 2], [3, 24])
        }
      ]);

      expect(getState().code).toEqual(`function sayHello() {
  console.log("Hello World!");
}`);
    });

    it("should apply a multi-line update instead of selection", async () => {
      const code = `function sayHello() {
  // Replace me with some code
}`;

      const [editor, getState] = createEditorOn(code);
      await editor.readThenWrite(Selection.cursorAt(0, 0), () => [
        {
          code: `console.log("Hello");
  console.log("World");`,
          selection: new Selection([1, 2], [1, 30])
        }
      ]);

      expect(getState().code).toEqual(`function sayHello() {
  console.log("Hello");
  console.log("World");
}`);
    });

    it("should apply a multi-line update on a multi-line selection", async () => {
      const code = `function doSomethingIfValid() {
  if (!isValid) {
    showWarning();
    return;
  } else {
    doSomething();
    doAnotherThing();
  }
}`;

      const [editor, getState] = createEditorOn(code);
      await editor.readThenWrite(Selection.cursorAt(0, 0), () => [
        {
          code: `{
  if (!isValid) {
    showWarning();
    return;
  }

  doSomething();
  doAnotherThing();
}`,
          selection: new Selection([0, 30], [8, 1])
        }
      ]);

      expect(getState().code).toEqual(`function doSomethingIfValid() {
  if (!isValid) {
    showWarning();
    return;
  }

  doSomething();
  doAnotherThing();
}`);
    });

    it("should apply multiple updates, in parallel", async () => {
      const code = `console.log("Hello!");`;

      const [editor, getState] = createEditorOn(code);
      await editor.readThenWrite(
        new Selection([0, 12], [0, 20]),
        (readCode) => [
          {
            code: `const extracted = ${readCode};\n`,
            selection: Selection.cursorAt(0, 0)
          },
          { code: `extracted`, selection: new Selection([0, 12], [0, 20]) }
        ]
      );

      expect(getState().code).toEqual(`const extracted = "Hello!";
console.log(extracted);`);
    });

    it("should apply multiple multi-lines updates, in parallel", async () => {
      const code = `console.log([
  "Hello!"
]);`;

      const [editor, getState] = createEditorOn(code);
      await editor.readThenWrite(new Selection([0, 12], [2, 1]), (readCode) => [
        {
          code: `const extracted = ${readCode};\n`,
          selection: Selection.cursorAt(0, 0)
        },
        { code: `extracted`, selection: new Selection([0, 12], [2, 1]) }
      ]);

      expect(getState().code).toEqual(`const extracted = [
  "Hello!"
];
console.log(extracted);`);
    });

    it("should set position to the given one", async () => {
      const code = `function sayHello() {
  // Replace me with some code
}`;
      const newPosition = new Position(2, 1);

      const [editor, getState] = createEditorOn(code);
      await editor.readThenWrite(
        new Selection([1, 2], [1, 30]),
        () => [],
        newPosition
      );

      expect(getState().position).toEqual(newPosition);
    });

    it("should default to initial position if no position is given", async () => {
      const code = `function sayHello() {
  // Replace me with some code
}`;
      const position = new Position(1, 2);

      const [editor, getState] = createEditorOn(code, position);
      await editor.readThenWrite(new Selection([1, 2], [1, 30]), () => []);

      expect(getState().position).toEqual(position);
    });
  });
}
