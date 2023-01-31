import { Position, Selection } from "../../editor";
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

  it("should add highlights until the top-most binding", async () => {
    const editor = new InMemoryEditor(`
function doSomething(req) {
  const liftPassCost = [cursor]req.query.cost;
  const liftPassType = req.query.type;

  console.log(liftPassCost, liftPassType);
}`);

    await toggleHighlight(editor);

    expect(editor.highlightedCode).toBe(`
function doSomething([h1]req[/h1]) {
  const liftPassCost = [h1]req[/h1].query.cost;
  const liftPassType = [h1]req[/h1].query.type;

  console.log(liftPassCost, liftPassType);
}`);
  });

  it("should highlight all references of a let declaration", async () => {
    const editor = new InMemoryEditor(`
let cost[cursor];
console.log(cost);

if (isValid) {
  cost = 10;

  if (isHolidays) {
    cost = 20;
  }
}`);

    await toggleHighlight(editor);

    expect(editor.highlightedCode).toBe(`
let [h1]cost[/h1];
console.log([h1]cost[/h1]);

if (isValid) {
  [h1]cost[/h1] = 10;

  if (isHolidays) {
    [h1]cost[/h1] = 20;
  }
}`);
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

  it("should not change the highlights if we insert code after them", async () => {
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

  it("should not change the highlights if we delete code after them", async () => {
    const editor = new InMemoryEditor(`
const someVariable[cursor] = 123;
const otherVariable = 456;
const anotherVariable = 789;`);
    await toggleHighlight(editor);
    editor.moveCursorTo(new Position(2, 6));
    await toggleHighlight(editor);

    await editor.delete(new Selection([3, 0], [4, 0]));

    expect(editor.highlightedCode).toBe(`
const [h1]someVariable[/h1] = 123;
const [h2]otherVariable[/h2] = 456;`);
  });

  it("should adapt the highlights if we insert code before them", async () => {
    const editor = new InMemoryEditor(`const someVariable[cursor] = 123;
const otherVariable = 456;`);
    await toggleHighlight(editor);
    editor.moveCursorTo(new Position(1, 6));
    await toggleHighlight(editor);

    await editor.insert(`/* hey */`, new Position(1, 0));

    expect(editor.highlightedCode).toBe(`const [h1]someVariable[/h1] = 123;
/* hey */const [h2]otherVariable[/h2] = 456;`);
  });

  it("should adapt the highlights if we insert code before them (with indentation)", async () => {
    const editor = new InMemoryEditor(`const someVariable[cursor] = 123;
    const otherVariable = 456;`);
    await toggleHighlight(editor);
    editor.moveCursorTo(new Position(1, 10));
    await toggleHighlight(editor);

    await editor.insert(`/* hey */`, new Position(1, 2));

    expect(editor.highlightedCode).toBe(`const [h1]someVariable[/h1] = 123;
  /* hey */  const [h2]otherVariable[/h2] = 456;`);
  });

  it("should adapt the highlights if we insert lines of code before them", async () => {
    const editor = new InMemoryEditor(`const someVariable[cursor] = 123;

const otherVariable = 456;`);
    await toggleHighlight(editor);
    editor.moveCursorTo(new Position(2, 6));
    await toggleHighlight(editor);

    await editor.insert(
      `/* hey */

// This is a new line`,
      new Position(1, 0)
    );

    expect(editor.highlightedCode).toBe(`const [h1]someVariable[/h1] = 123;
/* hey */

// This is a new line
const [h2]otherVariable[/h2] = 456;`);
  });

  it("should adapt the highlights if we insert lines of code before them (inserted code would end at same line than highlight starts)", async () => {
    const editor = new InMemoryEditor(`const someVariable[cursor] = 123;
const otherVariable = 456;`);
    await toggleHighlight(editor);
    editor.moveCursorTo(new Position(1, 6));
    await toggleHighlight(editor);

    await editor.insert(
      `
    // This is a comment`,
      new Position(0, 25)
    );

    expect(editor.highlightedCode).toBe(`const [h1]someVariable[/h1] = 123;
    // This is a comment
const [h2]otherVariable[/h2] = 456;`);
  });

  it("should adapt the highlights if we delete code before them", async () => {
    const editor = new InMemoryEditor(`/* hey */
const someVariable[cursor] = 123;
const otherVariable = 456;`);
    await toggleHighlight(editor);
    editor.moveCursorTo(new Position(2, 6));
    await toggleHighlight(editor);

    await editor.delete(new Selection([0, 0], [1, 0]));

    expect(editor.highlightedCode).toBe(`const [h1]someVariable[/h1] = 123;
const [h2]otherVariable[/h2] = 456;`);
  });

  it("should remove highlight if we rename a binding that's not the source", async () => {
    const editor = new InMemoryEditor(`const someVariable[cursor] = 123;
console.log(someVariable);`);
    await toggleHighlight(editor);
    expect(editor.highlightedCode).toBe(`const [h1]someVariable[/h1] = 123;
console.log([h1]someVariable[/h1]);`);

    await editor.delete(new Selection([1, 21], [1, 24]));

    expect(editor.highlightedCode).toBe(`const [h1]someVariable[/h1] = 123;
console.log(someVaria);`);
  });

  it("should remove highlight if we delete a binding", async () => {
    const editor = new InMemoryEditor(`const req[cursor] = { type: "val" };
console.log(req.type);`);
    await toggleHighlight(editor);
    expect(editor.highlightedCode).toBe(`const [h1]req[/h1] = { type: "val" };
console.log([h1]req[/h1].type);`);

    await editor.delete(new Selection([1, 12], [1, 16]));

    expect(editor.highlightedCode).toBe(`const [h1]req[/h1] = { type: "val" };
console.log(type);`);
  });

  it("should remove all highlights if we rename the source", async () => {
    const editor = new InMemoryEditor(`const someVariable[cursor] = 123;
console.log(someVariable);`);
    await toggleHighlight(editor);

    await editor.delete(new Selection([0, 15], [0, 18]));

    expect(editor.highlightedCode).toBe(`const someVaria = 123;
console.log(someVariable);`);
  });
});
