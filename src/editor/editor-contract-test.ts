import { assert } from "chai";
import { afterEach, suite, test } from "mocha";
import * as sinon from "sinon";

import { CodeReference } from "./code-reference";
import { AbsolutePath, Code, Editor, RelativePath } from "./editor";
import { Position } from "./position";
import { Selection } from "./selection";

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

export function createEditorContractTests(
  createEditorOn: (code: Code, position?: Position) => Promise<Editor>,
  cleanUp: () => Promise<void> = async () => {}
) {
  afterEach(cleanUp);

  suite("write", () => {
    test("should update code with the given one", async () => {
      const code = `function sayHello() {
  // Replace me with some code
}`;
      const newCode = `function sayHi() {
  console.log("Hello");
  console.log("How are you doing?");
}`;
      const editor = await createEditorOn(code);

      await editor.write(newCode);

      assert.strictEqual(editor.code, newCode);
    });

    test("should set position to the given one", async () => {
      const code = `function sayHello() {
  // Replace me with some code
}`;
      const newCode = `function sayHi() {
  console.log("Hello");
  console.log("How are you doing?");
}`;
      const newPosition = new Position(2, 3);
      const editor = await createEditorOn(code);

      await editor.write(newCode, newPosition);

      assert.deepStrictEqual(editor.selection.start, newPosition);
    });

    test("should default to initial position if no position is given", async () => {
      const code = `function sayHello() {
  // Replace me with some code
}`;
      const newCode = `function sayHi() {
  console.log("Hello");
  console.log("How are you doing?");
}`;
      const position = new Position(0, 1);
      const editor = await createEditorOn(code, position);

      await editor.write(newCode);

      assert.deepStrictEqual(editor.selection.start, position);
    });
  });

  suite("readThenWrite", () => {
    test("should call `getModifications()` with an empty string if given selection is a cursor", async () => {
      const code = `console.log("Hello")`;
      const getModifications = sinon.stub().returns([]);
      const editor = await createEditorOn(code);

      await editor.readThenWrite(Selection.cursorAt(0, 0), getModifications);

      sinon.assert.calledWith(getModifications, "");
    });

    test("should call `getModifications()` with the result of given selection", async () => {
      const code = `console.log("Hello")`;
      const getModifications = sinon.stub().returns([]);
      const editor = await createEditorOn(code);

      await editor.readThenWrite(
        new Selection([0, 13], [0, 18]),
        getModifications
      );

      sinon.assert.calledWith(getModifications, "Hello");
    });

    test("should call `getModifications()` with the result of given multi-lines selection", async () => {
      const code = `function sayHello() {
  console.log("Hello");
}`;
      const getModifications = sinon.stub().returns([]);
      const editor = await createEditorOn(code);

      await editor.readThenWrite(
        new Selection([0, 9], [2, 1]),
        getModifications
      );

      sinon.assert.calledWith(
        getModifications,
        `sayHello() {
  console.log("Hello");
}`
      );
    });

    test("should not change given code if no updates are given", async () => {
      const code = `console.log("Hello")`;
      const editor = await createEditorOn(code);

      await editor.readThenWrite(Selection.cursorAt(0, 0), () => []);

      assert.strictEqual(editor.code, code);
    });

    test("should apply update at cursor", async () => {
      const code = `console.log("Hello")`;
      const editor = await createEditorOn(code);

      await editor.readThenWrite(Selection.cursorAt(0, 0), () => [
        { code: " World!", selection: Selection.cursorAt(0, 18) }
      ]);

      assert.strictEqual(editor.code, `console.log("Hello World!")`);
    });

    test("should use read code to update code", async () => {
      const code = `console.log("Hello")`;
      const editor = await createEditorOn(code);

      await editor.readThenWrite(
        new Selection([0, 13], [0, 18]),
        (readCode) => [
          {
            code: `${readCode} you!`,
            selection: new Selection([0, 13], [0, 18])
          }
        ]
      );

      assert.strictEqual(editor.code, `console.log("Hello you!")`);
    });

    test("should apply update instead of selection", async () => {
      const code = `function sayHello() {
  console.log("Hello");
}`;
      const editor = await createEditorOn(code);

      await editor.readThenWrite(Selection.cursorAt(0, 0), () => [
        { code: `logger`, selection: new Selection([1, 2], [1, 13]) }
      ]);

      assert.strictEqual(
        editor.code,
        `function sayHello() {
  logger("Hello");
}`
      );
    });

    test("should preserve empty lines", async () => {
      const code = `console.log("Hello");

  console.log("World!");`;
      const editor = await createEditorOn(code);

      await editor.readThenWrite(Selection.cursorAt(0, 0), () => [
        {
          code: `console.log("Goodbye");`,
          selection: new Selection([0, 0], [0, 21])
        }
      ]);

      assert.strictEqual(
        editor.code,
        `console.log("Goodbye");

  console.log("World!");`
      );
    });

    test("should apply update instead of multi-line selection", async () => {
      const code = `function sayHello() {
  console.log("Hello");
  console.log("World");
  console.log("Boooh!");
}`;
      const editor = await createEditorOn(code);

      await editor.readThenWrite(Selection.cursorAt(0, 0), () => [
        {
          code: `console.log("Hello World!");`,
          selection: new Selection([1, 2], [3, 24])
        }
      ]);

      assert.strictEqual(
        editor.code,
        `function sayHello() {
  console.log("Hello World!");
}`
      );
    });

    test("should apply a multi-line update instead of selection", async () => {
      const code = `function sayHello() {
  // Replace me with some code
}`;
      const editor = await createEditorOn(code);

      await editor.readThenWrite(Selection.cursorAt(0, 0), () => [
        {
          code: `console.log("Hello");
  console.log("World");`,
          selection: new Selection([1, 2], [1, 30])
        }
      ]);

      assert.strictEqual(
        editor.code,
        `function sayHello() {
  console.log("Hello");
  console.log("World");
}`
      );
    });

    test("should apply a multi-line update on a multi-line selection", async () => {
      const code = `function doSomethingIfValid() {
  if (!isValid) {
    showWarning();
    return;
  } else {
    doSomething();
    doAnotherThing();
  }
}`;
      const editor = await createEditorOn(code);

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

      assert.strictEqual(
        editor.code,
        `function doSomethingIfValid() {
  if (!isValid) {
    showWarning();
    return;
  }

  doSomething();
  doAnotherThing();
}`
      );
    });

    test("should apply multiple updates, in parallel", async () => {
      const code = `console.log("Hello!");`;
      const editor = await createEditorOn(code);

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

      assert.strictEqual(
        editor.code,
        `const extracted = "Hello!";
console.log(extracted);`
      );
    });

    test("should apply multiple multi-lines updates, in parallel", async () => {
      const code = `console.log([
  "Hello!"
]);`;
      const editor = await createEditorOn(code);

      await editor.readThenWrite(new Selection([0, 12], [2, 1]), (readCode) => [
        {
          code: `const extracted = ${readCode};\n`,
          selection: Selection.cursorAt(0, 0)
        },
        { code: `extracted`, selection: new Selection([0, 12], [2, 1]) }
      ]);

      assert.strictEqual(
        editor.code,
        `const extracted = [
  "Hello!"
];
console.log(extracted);`
      );
    });

    test("should apply multiple updates on the same line, in parallel", async () => {
      const code = `console.log(data.response.code, data.response.user.id);`;
      const editor = await createEditorOn(code);

      await editor.readThenWrite(
        new Selection([0, 37], [0, 45]),
        (readCode) => [
          {
            code: `const { ${readCode} } = data;\n`,
            selection: Selection.cursorAt(0, 0)
          },
          { code: `response`, selection: new Selection([0, 32], [0, 45]) },
          { code: `response`, selection: new Selection([0, 12], [0, 25]) }
        ]
      );

      assert.strictEqual(
        editor.code,
        `const { response } = data;
console.log(response.code, response.user.id);`
      );
    });

    test("should set position to the given one", async () => {
      const code = `function sayHello() {
  // Replace me with some code
}`;
      const newPosition = new Position(2, 1);
      const editor = await createEditorOn(code);

      await editor.readThenWrite(
        new Selection([1, 2], [1, 30]),
        () => [],
        newPosition
      );

      assert.deepStrictEqual(editor.selection.start, newPosition);
    });

    test("should default to initial position if no position is given", async () => {
      const code = `function sayHello() {
  // Replace me with some code
}`;
      const position = new Position(1, 2);
      const editor = await createEditorOn(code, position);

      await editor.readThenWrite(new Selection([1, 2], [1, 30]), () => []);

      assert.deepStrictEqual(editor.selection.start, position);
    });
  });

  test("should write in a given file", async () => {
    const editor = await createEditorOn("");
    const filePath = new RelativePath("./some-file.ts");
    const code = `function sayHello() {
console.log("hello");
}`;

    await editor.writeIn(filePath, code);

    assert.strictEqual(await editor.codeOf(filePath), code);
  });

  test("should return the list of files in the workspace", async () => {
    const editor = await createEditorOn("");
    const files = [
      new RelativePath("README.md"),
      new RelativePath("./src/some-file.ts"),
      new RelativePath("./src/some-file.test.ts")
    ];
    for (const file of files) {
      await editor.writeIn(file, "");
    }

    const result = await editor.workspaceFiles();

    assert.sameDeepMembers(result, files);
  });

  test("should return the list of code references in same file", async () => {
    const code = `function add(num1, num2) {
return num1 + num2;
}
add(1, 2);
`;
    const editor = await createEditorOn(code);
    // Path seems to be fixed by the test runner.
    // Not ideal but it works for now.
    const filePath = new AbsolutePath(
      `${__dirname}/adapters/vscode-editor-tests/abracadabra-vscode-tests.ts`
    );
    await editor.writeIn(filePath, code);
    const codeReferences = await editor.getSelectionReferences(
      Selection.cursorAt(0, 9)
    );

    assert.strictEqual(codeReferences.length, 2);
    assert.deepStrictEqual(codeReferences, [
      new CodeReference(filePath, new Selection([0, 9], [0, 12])),
      new CodeReference(filePath, new Selection([3, 0], [3, 3]))
    ]);
  });
}
