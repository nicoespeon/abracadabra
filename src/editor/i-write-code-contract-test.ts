import { Code, Write, ReadThenWrite } from "./i-write-code";
import { Position } from "./position";
import { Selection } from "./selection";

export { createWriteCodeContractTests, createReadThenWriteCodeContractTests };

/**
 * This is a contract tests factory.
 *
 * It verifies that an adapter of the `Write` interface works as expected.
 * When you write an adapter, use this factory to generate the tests.
 *
 * The factory ask you to provide a way to call the implementation
 * on a given code, and to retrieve the updated code.
 *
 * Benefits of such technique:
 * - It tells you if your adapter works as expected by the code
 * - It tells you if everything still work when you upgrade the adapter
 */

function createWriteCodeContractTests(
  adapterName: string,
  createWriteOn: (
    code: Code,
    position?: Position
  ) => [Write, () => { code: Code; position: Position }]
) {
  describe(`${adapterName} Write`, () => {
    it("should update code with the given one", async () => {
      const code = `function sayHello() {
  // Replace me with some code
}`;
      const newCode = `function sayHi() {
  console.log("Hello");
  console.log("How are you doing?");
}`;

      const [write, getState] = createWriteOn(code);
      await write(newCode);

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

      const [write, getState] = createWriteOn(code);
      await write(newCode, newPosition);

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

      const [write, getState] = createWriteOn(code, position);
      await write(newCode);

      expect(getState().position).toEqual(position);
    });
  });
}

function createReadThenWriteCodeContractTests(
  adapterName: string,
  createReadThenWriteOn: (code: Code) => [ReadThenWrite, () => Code]
) {
  describe(`${adapterName} ReadThenWrite`, () => {
    it("should call `getUpdates()` with an empty string if given selection is a cursor", async () => {
      const code = `console.log("Hello")`;
      const getUpdates = jest.fn().mockReturnValue([]);

      const [readThenWrite] = createReadThenWriteOn(code);
      await readThenWrite(Selection.cursorAt(0, 0), getUpdates);

      expect(getUpdates).toBeCalledWith("");
    });

    it("should call `getUpdates()` with the result of given selection", async () => {
      const code = `console.log("Hello")`;
      const getUpdates = jest.fn().mockReturnValue([]);

      const [readThenWrite] = createReadThenWriteOn(code);
      await readThenWrite(new Selection([0, 13], [0, 18]), getUpdates);

      expect(getUpdates).toBeCalledWith("Hello");
    });

    it("should call `getUpdates()` with the result of given multi-lines selection", async () => {
      const code = `function sayHello() {
  console.log("Hello");
}`;
      const getUpdates = jest.fn().mockReturnValue([]);

      const [readThenWrite] = createReadThenWriteOn(code);
      await readThenWrite(new Selection([0, 9], [2, 1]), getUpdates);

      expect(getUpdates).toBeCalledWith(`sayHello() {
  console.log("Hello");
}`);
    });

    it("should not change given code if no updates are given", async () => {
      const code = `console.log("Hello")`;

      const [readThenWrite, getCode] = createReadThenWriteOn(code);
      await readThenWrite(Selection.cursorAt(0, 0), () => []);

      expect(getCode()).toEqual(code);
    });

    it("should apply update at cursor", async () => {
      const code = `console.log("Hello")`;

      const [readThenWrite, getCode] = createReadThenWriteOn(code);
      await readThenWrite(Selection.cursorAt(0, 0), () => [
        { code: " World!", selection: Selection.cursorAt(0, 18) }
      ]);

      expect(getCode()).toEqual(`console.log("Hello World!")`);
    });

    it("should use read code to update code", async () => {
      const code = `console.log("Hello")`;

      const [readThenWrite, getCode] = createReadThenWriteOn(code);
      await readThenWrite(new Selection([0, 13], [0, 18]), readCode => [
        { code: `${readCode} you!`, selection: new Selection([0, 13], [0, 18]) }
      ]);

      expect(getCode()).toEqual(`console.log("Hello you!")`);
    });

    it("should apply update instead of selection", async () => {
      const code = `function sayHello() {
  console.log("Hello");
}`;

      const [readThenWrite, getCode] = createReadThenWriteOn(code);
      await readThenWrite(Selection.cursorAt(0, 0), () => [
        { code: `logger`, selection: new Selection([1, 2], [1, 13]) }
      ]);

      expect(getCode()).toEqual(`function sayHello() {
  logger("Hello");
}`);
    });

    it("should apply update instead of multi-line selection", async () => {
      const code = `function sayHello() {
  console.log("Hello");
  console.log("World");
  console.log("Boooh!");
}`;

      const [readThenWrite, getCode] = createReadThenWriteOn(code);
      await readThenWrite(Selection.cursorAt(0, 0), () => [
        {
          code: `console.log("Hello World!");`,
          selection: new Selection([1, 2], [3, 24])
        }
      ]);

      expect(getCode()).toEqual(`function sayHello() {
  console.log("Hello World!");
}`);
    });

    it("should apply a multi-line update instead of selection", async () => {
      const code = `function sayHello() {
  // Replace me with some code
}`;

      const [readThenWrite, getCode] = createReadThenWriteOn(code);
      await readThenWrite(Selection.cursorAt(0, 0), () => [
        {
          code: `console.log("Hello");
  console.log("World");`,
          selection: new Selection([1, 2], [1, 30])
        }
      ]);

      expect(getCode()).toEqual(`function sayHello() {
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

      const [readThenWrite, getCode] = createReadThenWriteOn(code);
      await readThenWrite(Selection.cursorAt(0, 0), () => [
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

      expect(getCode()).toEqual(`function doSomethingIfValid() {
  if (!isValid) {
    showWarning();
    return;
  }

  doSomething();
  doAnotherThing();
}`);
    });

    it("should apply multiple updates, in order", async () => {
      const code = `function sayHello() {
  // Replace me with some code
}`;

      const [readThenWrite, getCode] = createReadThenWriteOn(code);
      await readThenWrite(Selection.cursorAt(0, 0), () => [
        {
          code: `console.log("Hello");
  console.log("How are you doing?");`,
          selection: new Selection([1, 2], [1, 30])
        },
        {
          code: `sayHi`,
          selection: new Selection([0, 9], [0, 17])
        }
      ]);

      expect(getCode()).toEqual(`function sayHi() {
  console.log("Hello");
  console.log("How are you doing?");
}`);
    });
  });
}
