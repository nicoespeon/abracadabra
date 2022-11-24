import { Position } from "../../editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import removeAllHighlightsConfig from "../remove-all-highlights";
import { toggleHighlight } from "./toggle-highlight";

const removeAllHighlights = removeAllHighlightsConfig.command.operation;

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

  it("should remove all highlights", async () => {
    const editor = new InMemoryEditor(`
const someVariable[cursor] = 123;
const otherVariable = 456;`);
    await toggleHighlight(editor);
    editor.moveCursorTo(new Position(2, 6));
    await toggleHighlight(editor);

    await removeAllHighlights(editor);

    expect(editor.highlightedCode).toBe(`
const someVariable = 123;
const otherVariable = 456;`);
  });

  it("should not change the highlights if we update code after them", async () => {
    const editor = new InMemoryEditor(`
const someVariable[cursor] = 123;
const otherVariable = 456;`);
    await toggleHighlight(editor);
    editor.moveCursorTo(new Position(2, 6));
    await toggleHighlight(editor);

    await editor.insert(`const anotherVariable = 789;`, new Position(3, 0));

    expect(editor.highlightedCode).toBe(`
const [h1]someVariable[/h1] = 123;
const [h2]otherVariable[/h2] = 456;
const anotherVariable = 789;`);
  });

  it("should adapt the highlights if we update code before them", async () => {
    const editor = new InMemoryEditor(`const someVariable[cursor] = 123;
const otherVariable = 456;`);
    await toggleHighlight(editor);
    editor.moveCursorTo(new Position(1, 6));
    await toggleHighlight(editor);

    await editor.insert(`/* hey */`, new Position(1, 0));

    expect(editor.highlightedCode).toBe(`const [h1]someVariable[/h1] = 123;
/* hey */const [h2]otherVariable[/h2] = 456;`);
  });

  // TODO: simulate changes OVERLAPPING the highlights => they should adapt
  // TODO: highlight nested identifier should identify the top-most binding
});
