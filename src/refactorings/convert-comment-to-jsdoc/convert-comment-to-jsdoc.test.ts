import * as t from "../../ast";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code } from "../../editor/editor";
import {
  convertCommentToJSDoc,
  createVisitor
} from "./convert-comment-to-jsdoc";

describe("Convert Comment to JSDoc", () => {
  describe("single-line comment to single-line JSDoc", () => {
    it("converts a single-line comment above a property", () => {
      shouldConvert({
        code: `interface Props {
  // some comment[cursor]
  a: number
}`,
        expected: `interface Props {
  /** some comment */
  a: number
}`
      });
    });

    it("converts a single-line comment above a variable", () => {
      shouldConvert({
        code: `// some comment[cursor]
const a = 1;`,
        expected: `/** some comment */
const a = 1;`
      });
    });

    it("converts when cursor is at the beginning of the comment", () => {
      shouldConvert({
        code: `[cursor]// some comment
const a = 1;`,
        expected: `/** some comment */
const a = 1;`
      });
    });

    it("preserves leading whitespace in the comment", () => {
      shouldConvert({
        code: `interface Props {
  //   comment with extra spaces[cursor]
  a: number
}`,
        expected: `interface Props {
  /**   comment with extra spaces */
  a: number
}`
      });
    });
  });

  describe("multi-line comments to multi-line JSDoc", () => {
    it("converts multiple consecutive single-line comments", () => {
      shouldConvert({
        code: `interface Props {
  // comment line 1[cursor]
  // comment line 2
  a: number
}`,
        expected: `interface Props {
  /**
   * comment line 1
   * comment line 2
   */
  a: number
}`
      });
    });

    it("converts when cursor is on second line of comments", () => {
      shouldConvert({
        code: `interface Props {
  // comment line 1
  // comment line 2[cursor]
  a: number
}`,
        expected: `interface Props {
  /**
   * comment line 1
   * comment line 2
   */
  a: number
}`
      });
    });

    it("converts three consecutive single-line comments", () => {
      shouldConvert({
        code: `// first line[cursor]
// second line
// third line
function test() {}`,
        expected: `/**
 * first line
 * second line
 * third line
 */
function test() {}`
      });
    });
  });

  describe("comments above functions", () => {
    it("converts a comment above a function declaration", () => {
      shouldConvert({
        code: `// add two number[cursor]
function add(a, b) {

}`,
        expected: `/**
 * add two number
 */
function add(a, b) {

}`
      });
    });

    it("converts a comment above an arrow function variable", () => {
      shouldConvert({
        code: `// add two number[cursor]
const add = (a, b) => {}`,
        expected: `/**
 * add two number
 */
const add = (a, b) => {};`
      });
    });

    it("converts a comment above an async function", () => {
      shouldConvert({
        code: `// fetches data[cursor]
async function fetchData() {
  return await fetch('/api');
}`,
        expected: `/**
 * fetches data
 */
async function fetchData() {
  return await fetch('/api');
}`
      });
    });

    it("converts a comment above a class method", () => {
      shouldConvert({
        code: `class Calculator {
  // adds two numbers[cursor]
  add(a, b) {
    return a + b;
  }
}`,
        expected: `class Calculator {
  /**
   * adds two numbers
   */
  add(a, b) {
    return a + b;
  }
}`
      });
    });
  });

  describe("preserves existing formatting", () => {
    it("preserves indentation", () => {
      shouldConvert({
        code: `class Example {
    // deeply indented comment[cursor]
    method() {}
}`,
        expected: `class Example {
    /**
     * deeply indented comment
     */
    method() {}
}`
      });
    });
  });

  describe("edge cases", () => {
    it("should not convert a block comment", () => {
      shouldShowError({
        code: `/* existing block comment[cursor] */
const a = 1;`
      });
    });

    it("should not convert when there is no code following the comment", () => {
      shouldShowError({
        code: `const a = 1;
// trailing comment[cursor]`
      });
    });

    it("should not convert an inline comment", () => {
      shouldShowError({
        code: `const a = 1; // inline comment[cursor]`
      });
    });
  });
});

function shouldConvert({ code, expected }: { code: Code; expected: Code }) {
  const editor = new InMemoryEditor(code);
  const result = convertCommentToJSDoc({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });

  expect(result).toMatchObject({ action: "write", code: expected });
}

function shouldShowError({ code }: { code: Code }) {
  const editor = new InMemoryEditor(code);
  const result = convertCommentToJSDoc({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });

  expect(result.action).toBe("show error");
}

describe("createVisitor", () => {
  it("should match when cursor is on a single-line comment", () => {
    const code = `// some comment
const a = 1;`;
    const editor = new InMemoryEditor(code);
    let matched = false;

    const visitor = createVisitor(editor.selection, () => {
      matched = true;
    });

    t.traverseAST(t.parse(code), visitor);

    expect(matched).toBe(true);
  });

  it("should match when comment is after other code", () => {
    const code = `function hello() {}

hello();

// Some comment[cursor]
var someVar = 1;`;
    const editor = new InMemoryEditor(code);
    let matched = false;

    const visitor = createVisitor(editor.selection, () => {
      matched = true;
    });

    t.traverseAST(t.parse(editor.code), visitor);

    expect(matched).toBe(true);
  });

  it("should not match when cursor is not on a comment", () => {
    const code = `const a = 1;[cursor]`;
    const editor = new InMemoryEditor(code);
    let matched = false;

    const visitor = createVisitor(editor.selection, () => {
      matched = true;
    });

    t.traverseAST(t.parse(editor.code), visitor);

    expect(matched).toBe(false);
  });

  it("should not match when comment has no code following", () => {
    const code = `const a = 1;
// trailing comment[cursor]`;
    const editor = new InMemoryEditor(code);
    let matched = false;

    const visitor = createVisitor(editor.selection, () => {
      matched = true;
    });

    t.traverseAST(t.parse(editor.code), visitor);

    expect(matched).toBe(false);
  });
});
