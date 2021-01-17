import * as assert from "assert";
import { suite, test } from "mocha";

import { createEditorContractTests } from "../editor-contract-test";
import { Position } from "../position";
import { Selection } from "../selection";

import { InMemoryEditor } from "./in-memory-editor";

suite("InMemory Editor", () => {
  createEditorContractTests(
    async (code, position = new Position(0, 0)) =>
      new InMemoryEditor(code, position)
  );

  test("should parse [cursor] as position", () => {
    const code = `function doSomething() {
  console.log("something");
  co[cursor]nsole.log("something else");
}`;

    const editor = new InMemoryEditor(code);

    assert.strictEqual(
      editor.code,
      `function doSomething() {
  console.log("something");
  console.log("something else");
}`
    );
    assert.deepStrictEqual(editor.position, new Position(2, 4));
  });

  test("should parse [start] and [end] as selection", () => {
    const code = `function doSomething() {
  [start]console.log("something");
  console.log("something else");[end]
}`;

    const editor = new InMemoryEditor(code);

    assert.strictEqual(
      editor.code,
      `function doSomething() {
  console.log("something");
  console.log("something else");
}`
    );
    assert.deepStrictEqual(editor.selection, new Selection([1, 2], [2, 32]));
  });

  test("should parse [start] and [end] as selection (one-liner)", () => {
    const code = `console.log('Hello [start]world[end]! How are you doing?');`;

    const editor = new InMemoryEditor(code);

    assert.strictEqual(
      editor.code,
      `console.log('Hello world! How are you doing?');`
    );
    assert.deepStrictEqual(editor.selection, new Selection([0, 19], [0, 24]));
  });
});
