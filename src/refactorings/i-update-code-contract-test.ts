import { Code, Write } from "./i-update-code";
import { Selection } from "./selection";

export { createUpdateCodeContractTests };

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

function createUpdateCodeContractTests(
  adapterName: string,
  createWriteOn: (code: Code) => [Write, () => Code]
) {
  describe(`${adapterName} Write`, () => {
    it("should not change given code if no updates are given", async () => {
      const code = `console.log("Hello")`;

      const [write, getCode] = createWriteOn(code);
      await write([]);

      expect(getCode()).toEqual(code);
    });

    it("should apply update at cursor", async () => {
      const code = `console.log("Hello")`;

      const [write, getCode] = createWriteOn(code);
      await write([{ code: " World!", selection: Selection.cursorAt(0, 18) }]);

      expect(getCode()).toEqual(`console.log("Hello World!")`);
    });

    it("should apply update instead of selection", async () => {
      const code = `function sayHello() {
  console.log("Hello");
}`;

      const [write, getCode] = createWriteOn(code);
      await write([
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

      const [write, getCode] = createWriteOn(code);
      await write([
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

      const [write, getCode] = createWriteOn(code);
      await write([
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

      const [write, getCode] = createWriteOn(code);
      await write([
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

      const [write, getCode] = createWriteOn(code);
      await write([
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
