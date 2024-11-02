import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code } from "../../editor/editor";
import { splitMultipleDeclarations } from "./split-multiple-declarations";

describe("Split Multiple Declarations", () => {
  it(`basic let multiple declarations`, () => {
    shouldSplitMultipleDeclarations({
      code: `let firstName, lastName;`,
      expected: `let firstName;
let lastName;`
    });
  });

  it(`basic var multiple declarations`, () => {
    shouldSplitMultipleDeclarations({
      code: `var firstName, lastName;`,
      expected: `var firstName;
var lastName;`
    });
  });

  it(`basic const multiple declarations`, () => {
    shouldSplitMultipleDeclarations({
      code: `const firstName = "Jane", lastName = "Doe";`,
      expected: `const firstName = "Jane";
const lastName = "Doe";`
    });
  });

  it(`mixed multiple declarations with initialization and without initialization`, () => {
    shouldSplitMultipleDeclarations({
      code: `let firstName = 'John', lastName, details = {age: 10, country: "Moon"};`,
      expected: `let firstName = 'John';
let lastName;
let details = {age: 10, country: "Moon"};`
    });
  });

  it(`typescript multiple declarations split conserves type annotations`, () => {
    shouldSplitMultipleDeclarations({
      code: `let firstName: string = 'John', age: number = 7`,
      expected: `let firstName: string = 'John';
let age: number = 7;`
    });
  });

  it(`preserves comments`, () => {
    shouldSplitMultipleDeclarations({
      code: `// leading comment
const x = 1, y = 2;
// trailing comment`,
      expected: `// leading comment
const x = 1;

const y = 2;
// trailing comment`
    });
  });

  it("should show an error message if refactoring can't be made", async () => {
    const editor = new InMemoryEditor(
      `// This is a comment, can't be refactored`
    );

    const result = splitMultipleDeclarations({
      state: "new",
      code: editor.code,
      selection: editor.selection
    });

    expect(result.action).toBe("show error");
  });
});

function shouldSplitMultipleDeclarations({
  code,
  expected
}: {
  code: Code;
  expected: Code;
}) {
  const editor = new InMemoryEditor(code);

  const result = splitMultipleDeclarations({
    state: "new",
    code: editor.code,
    selection: editor.selection
  });

  expect(result).toEqual({ action: "write", code: expected });
}
