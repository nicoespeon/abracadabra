import { Position } from "../editor";
import { InMemoryEditor } from "../editor/adapters/in-memory-editor";
import { toggleHighlight } from "./toggle-highlight";

describe("Toggle Highlight", () => {
  it("should add highlight around a single identifier", async () => {
    const editor = new InMemoryEditor("const someVariable[cursor] = 123");

    await toggleHighlight(editor);

    expect(editor.highlightedCode).toBe("const [h1]someVariable[/h1] = 123");
  });

  it("should toggle highlight off", async () => {
    const editor = new InMemoryEditor("const someVariable[cursor] = 123");

    await toggleHighlight(editor);
    await toggleHighlight(editor);

    expect(editor.highlightedCode).toBe("const someVariable = 123");
  });

  it("should add highlight around all bound identifiers", async () => {
    const editor = new InMemoryEditor(`
function doSomething() {
  const someVariable[cursor] = 123;

  console.log(someVariable);
  return someVariable;
}

console.log(someVariable);`);

    await toggleHighlight(editor);

    expect(editor.highlightedCode).toBe(`
function doSomething() {
  const [h1]someVariable[/h1] = 123;

  console.log([h1]someVariable[/h1]);
  return [h1]someVariable[/h1];
}

console.log(someVariable);`);
  });

  it("should add distinct highlights on different identifiers", async () => {
    const editor = new InMemoryEditor(`
const someVariable[cursor] = 123;
const otherVariable = 456`);

    await toggleHighlight(editor);
    editor.moveCursorTo(new Position(2, 6));
    await toggleHighlight(editor);

    expect(editor.highlightedCode).toBe(`
const [h1]someVariable[/h1] = 123;
const [h2]otherVariable[/h2] = 456`);
  });

  it("should toggle highlight off for selected identifiers", async () => {
    const editor = new InMemoryEditor(`
const someVariable[cursor] = 123;
const otherVariable = 456`);

    await toggleHighlight(editor);
    editor.moveCursorTo(new Position(2, 6));
    await toggleHighlight(editor);
    editor.moveCursorTo(new Position(1, 6));
    await toggleHighlight(editor);

    expect(editor.highlightedCode).toBe(`
const someVariable = 123;
const [h2]otherVariable[/h2] = 456`);
  });
});

// TODO: add a command to remove all highlights
// TODO: on code update, recompute the impacted highlights
// See https://github.com/BrandonBlaschke/vscode-easy-highlight/blob/master/src/extension.ts for an example (he recomputes the decorations from a Recorder)
