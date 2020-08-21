import { createEditorContractTests } from "../editor-contract-test";
import { Position } from "../position";

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
});
