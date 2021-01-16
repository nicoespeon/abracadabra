import { createEditorContractTests } from "../editor-contract-test";
import { Position } from "../position";
import { Selection } from "../selection";

import { InMemoryEditor } from "./in-memory-editor";

describe("InMemory Editor", () => {
  createEditorContractTests((code, position = new Position(0, 0)) => {
    const editor = new InMemoryEditor(code, position);
    return [editor, () => ({ code: editor.code, position: editor.position })];
  });

  it("should parse [cursor] as position", () => {
    const code = `function doSomething() {
  console.log("something");
  co[cursor]nsole.log("something else");
}`;

    const editor = new InMemoryEditor(code);

    expect(editor.code).toBe(`function doSomething() {
  console.log("something");
  console.log("something else");
}`);
    expect(editor.position).toEqual(new Position(2, 4));
  });

  it("should parse [start] and [end] as selection", () => {
    const code = `function doSomething() {
  [start]console.log("something");
  console.log("something else");[end]
}`;

    const editor = new InMemoryEditor(code);

    expect(editor.code).toBe(`function doSomething() {
  console.log("something");
  console.log("something else");
}`);
    expect(editor.selection).toEqual(new Selection([1, 2], [2, 32]));
  });

  it("should parse [start] and [end] as selection (one-liner)", () => {
    const code = `console.log('Hello [start]world[end]! How are you doing?');`;

    const editor = new InMemoryEditor(code);

    expect(editor.code).toBe(`console.log('Hello world! How are you doing?');`);
    expect(editor.selection).toEqual(new Selection([0, 19], [0, 24]));
  });
});
