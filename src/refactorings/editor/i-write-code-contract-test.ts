import { Code, Write } from "./i-write-code";

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
  createWriteOn: (code: Code) => [Write, () => Code]
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

      const [write, getCode] = createWriteOn(code);
      await write(newCode);

      expect(getCode()).toEqual(newCode);
    });
  });
}
