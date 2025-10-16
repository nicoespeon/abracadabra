import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code } from "../../editor/editor";
import { simplifyBoolean } from "./simplify-boolean";

describe("Simplify Boolean", () => {
  describe("should simplify boolean", () => {
    it("true || somethingElse", () => {
      shouldSimplifyBoolean({
        code: `if(true || somethingElse[cursor]) {}`,
        expected: `if(true) {}`
      });
    });

    it("somethingElse || true", () => {
      shouldSimplifyBoolean({
        code: `if(somethingElse || true[cursor]) {}`,
        expected: `if(true) {}`
      });
    });

    it("false || somethingElse", () => {
      shouldSimplifyBoolean({
        code: `if(false || somethingElse[cursor]) {}`,
        expected: `if(somethingElse) {}`
      });
    });

    it("somethingElse || false", () => {
      shouldSimplifyBoolean({
        code: `if(somethingElse || false[cursor]) {}`,
        expected: `if(somethingElse) {}`
      });
    });

    it("true && somethingElse", () => {
      shouldSimplifyBoolean({
        code: `if(true && somethingElse[cursor]) {}`,
        expected: `if(somethingElse) {}`
      });
    });

    it("somethingElse && true", () => {
      shouldSimplifyBoolean({
        code: `if(somethingElse && true[cursor]) {}`,
        expected: `if(somethingElse) {}`
      });
    });

    it("false && somethingElse", () => {
      shouldSimplifyBoolean({
        code: `if(false && somethingElse[cursor]) {}`,
        expected: `if(false) {}`
      });
    });

    it("somethingElse && false", () => {
      shouldSimplifyBoolean({
        code: `if(somethingElse && false[cursor]) {}`,
        expected: `if(false) {}`
      });
    });

    it("handle !true as false", () => {
      shouldSimplifyBoolean({
        code: `if(somethingElse && !true[cursor]) {}`,
        expected: `if(!true) {}`
      });
    });

    it("handle !false as true", () => {
      shouldSimplifyBoolean({
        code: `if(somethingElse || !false[cursor]) {}`,
        expected: `if(!false) {}`
      });
    });

    it("nested condition", () => {
      shouldSimplifyBoolean({
        code: `if([cursor]somethingElse && true && anotherOne) {}`,
        expected: `if(somethingElse && anotherOne) {}`
      });
    });

    it("ternary", () => {
      shouldSimplifyBoolean({
        code: `true || somethingElse[cursor] ? "hello" : "world"`,
        expected: `true ? "hello" : "world"`
      });
    });
  });

  it("should show an error message if refactoring can't be made", () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    const result = simplifyBoolean({
      state: "new",
      code: editor.code,
      selection: editor.selection
    });

    expect(result.action).toBe("show error");
  });
});

function shouldSimplifyBoolean({
  code,
  expected
}: {
  code: Code;
  expected: Code;
}) {
  const editor = new InMemoryEditor(code);
  const result = simplifyBoolean({
    state: "new",
    code: editor.code,
    selection: editor.selection
  });

  expect(result).toMatchObject({ action: "write", code: expected });
}
