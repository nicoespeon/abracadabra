import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code } from "../../editor/editor";
import { splitDeclarationAndInitialization } from "./split-declaration-and-initialization";

describe("Split Declaration and Initialization", () => {
  describe("should split declaration and initialization", () => {
    it("basic const assignment", () => {
      shouldSplitDeclarationAndInitialization({
        code: `const firstName = "Jane";`,
        expected: `let firstName;
firstName = "Jane";`
      });
    });

    it("basic var assignment", () => {
      shouldSplitDeclarationAndInitialization({
        code: `var firstName = "Jane";`,
        expected: `var firstName;
firstName = "Jane";`
      });
    });

    it("basic let assignment", () => {
      shouldSplitDeclarationAndInitialization({
        code: `let firstName = "Jane";`,
        expected: `let firstName;
firstName = "Jane";`
      });
    });

    it("assignment to null", () => {
      shouldSplitDeclarationAndInitialization({
        code: `const firstName = null;`,
        expected: `let firstName;
firstName = null;`
      });
    });

    it("the selected assignment", () => {
      shouldSplitDeclarationAndInitialization({
        code: `const firstName = "Jane";
const lastName = "Doe";`,
        expected: `let firstName;
firstName = "Jane";
const lastName = "Doe";`
      });
    });

    it("multi-lines assignment (selection in the middle)", () => {
      shouldSplitDeclarationAndInitialization({
        code: `const firstName =
  [cursor]"Jane";`,
        expected: `let firstName;
firstName = "Jane";`
      });
    });

    it("multiple declarations", () => {
      shouldSplitDeclarationAndInitialization({
        code: `const firstName = "Jane", lastName = "Doe";`,
        expected: `let firstName, lastName;
firstName = "Jane";
lastName = "Doe";`
      });
    });

    it("some declarations without initialization", () => {
      shouldSplitDeclarationAndInitialization({
        code: `let firstName = "Jane", lastName = "Doe", age;`,
        expected: `let firstName, lastName, age;
firstName = "Jane";
lastName = "Doe";`
      });
    });

    it("declarations with type annotations", () => {
      shouldSplitDeclarationAndInitialization({
        code: `const firstName: string = "Jane", age: number = 90;`,
        expected: `let firstName: string, age: number;
firstName = "Jane";
age = 90;`
      });
    });

    it("nested declaration, cursor on wrapper", () => {
      shouldSplitDeclarationAndInitialization({
        code: `const getLastName = () => {
  const lastName = "Doe";
  return lastName;
};`,
        expected: `let getLastName;

getLastName = () => {
  const lastName = "Doe";
  return lastName;
};`
      });
    });

    it("nested declaration, cursor on nested", () => {
      shouldSplitDeclarationAndInitialization({
        code: `const getLastName = () => {
  [cursor]const lastName = "Doe";
  return lastName;
};`,
        expected: `const getLastName = () => {
  let lastName;
  lastName = "Doe";
  return lastName;
};`
      });
    });

    it("destructured assignment", () => {
      shouldSplitDeclarationAndInitialization({
        code: `const { firstName } = someObject;`,
        expected: `let firstName;
({ firstName } = someObject);`
      });
    });

    it("destructured assignment, multiple values", () => {
      shouldSplitDeclarationAndInitialization({
        code: `const { firstName, lastName, ...others } = someObject;`,
        expected: `let firstName, lastName, others;
({ firstName, lastName, ...others } = someObject);`
      });
    });

    it("preserves comments", () => {
      shouldSplitDeclarationAndInitialization({
        code: `// leading comment
[cursor]const firstName = "Jane";
// trailing comment`,
        expected: `// leading comment
let firstName;

firstName = "Jane";
// trailing comment`
      });
    });
  });

  it("should throw an error if there is nothing to split", () => {
    const code = `pass[cursor]engersCount = 1;`;
    const editor = new InMemoryEditor(code);
    const result = splitDeclarationAndInitialization({
      state: "new",
      code: editor.code,
      selection: editor.selection,
      highlightSources: []
    });

    expect(result.action).toBe("show error");
  });

  it("should throw an error if variable is not initialized", () => {
    const code = `var [cursor]firstName;`;
    const editor = new InMemoryEditor(code);
    const result = splitDeclarationAndInitialization({
      state: "new",
      code: editor.code,
      selection: editor.selection,
      highlightSources: []
    });

    expect(result.action).toBe("show error");
  });
});

function shouldSplitDeclarationAndInitialization({
  code,
  expected
}: {
  code: Code;
  expected: Code;
}) {
  const editor = new InMemoryEditor(code);
  const result = splitDeclarationAndInitialization({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });

  expect(result).toMatchObject({ action: "write", code: expected });
}
