import { Code, Write } from "./i-write-code";
import { Position } from "./position";

export { createWriteCodeContractTests };

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
