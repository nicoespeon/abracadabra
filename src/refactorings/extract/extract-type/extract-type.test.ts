import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { Code } from "../../../editor/editor";
import { Position } from "../../../editor/position";
import { Selection } from "../../../editor/selection";
import { extractType } from "./extract-type";

describe("Extract Type", () => {
  describe("should extract type", () => {
    it("basic scenario", () => {
      shouldExtractType({
        code: `let something: number[cursor];`,
        expected: `type Extracted = number;
let something: Extracted;`
      });
    });

    it("selected type only", () => {
      shouldExtractType({
        code: `let something: number[cursor];
let somethingElse: string;`,
        expected: `type Extracted = number;
let something: Extracted;
let somethingElse: string;`
      });
    });

    it("create interface if extracted type is an object", () => {
      shouldExtractType({
        code: `let something: [start]{ hello: string; }[end];`,
        expected: `interface Extracted {
  hello: string;
}

let something: Extracted;`
      });
    });

    it("with comment above", () => {
      shouldExtractType({
        code: `// Hello there!
let something: number[cursor];`,
        expected: `type [cursor]Extracted = number;
// Hello there!
let something: Extracted;`
      });
    });

    it("closest scope from (A | B)", () => {
      shouldExtractType({
        code: `let something: boolean | number[cursor] | string;`,
        expected: `type [cursor]Extracted = number;
let something: boolean | Extracted | string;`
      });
    });

    it("closest scope from (A & B)", () => {
      shouldExtractType({
        code: `let something: Hello[cursor] & World;`,
        expected: `type [cursor]Extracted = Hello;
let something: Extracted & World;`
      });
    });

    it("closest scope from (A & B | C)", () => {
      shouldExtractType({
        code: `let something: Hello[start] & World[end] | boolean;`,
        expected: `type [cursor]Extracted = Hello & World;
let something: Extracted | boolean;`
      });
    });

    it("nested type", () => {
      shouldExtractType({
        code: `let something: { response: { data: string[cursor]; } };`,
        expected: `type [cursor]Extracted = string;
let something: { response: { data: Extracted; } };`
      });
    });

    it("nested interface", () => {
      shouldExtractType({
        code: `let something: { response: [start]{ data: string[end]; } };`,
        expected: `interface [cursor]Extracted {
  data: string;
}

let something: { response: Extracted };`
      });
    });

    it("as expression", () => {
      shouldExtractType({
        code: `console.log(person as [cursor]{ name: string });`,
        expected: `interface [cursor]Extracted {
  name: string;
}

console.log(person as Extracted);`
      });
    });

    it("type parameter of a call expression", () => {
      shouldExtractType({
        code: `doSomething<[cursor]string, number>(someVariable);`,
        expected: `type [cursor]Extracted = string;
doSomething<Extracted, number>(someVariable);`
      });
    });

    it("nested type parameter of a call expression (cursor on nested)", () => {
      shouldExtractType({
        code: `doSomething<Array<[cursor]string>>(someVariable);`,
        expected: `type [cursor]Extracted = string;
doSomething<Array<Extracted>>(someVariable);`
      });
    });

    it("nested type parameter of a call expression (cursor on parent)", () => {
      shouldExtractType({
        code: `doSomething<[cursor]Array<string>>(someVariable);`,
        expected: `type [cursor]Extracted = Array<string>;
doSomething<Extracted>(someVariable);`
      });
    });

    it("TS type query", () => {
      shouldExtractType({
        code: `type Context = ContextFrom<typeof [cursor]someMachineModel>;`,
        expected: `type [cursor]Extracted = typeof someMachineModel;
type Context = ContextFrom<Extracted>;`
      });
    });

    it("TS union type", () => {
      shouldExtractType({
        code: `const someMachine = createMachine<
  C<typeof someModel>,
  M<typeof commonModel> [cursor]| M<typeof someModel>
>()`,
        expected: `type [cursor]Extracted = M<typeof commonModel> | M<typeof someModel>;
const someMachine = createMachine<C<typeof someModel>, Extracted>()`
      });
    });

    it("TS intersection type", () => {
      shouldExtractType({
        code: `const someMachine = createMachine<
  C<typeof someModel>,
  M<typeof commonModel> [cursor]& M<typeof someModel>
>()`,
        expected: `type [cursor]Extracted = M<typeof commonModel> & M<typeof someModel>;
const someMachine = createMachine<C<typeof someModel>, Extracted>()`
      });
    });

    it("object type using commas", () => {
      shouldExtractType({
        code: `function doSomething(options: { first: number, second: boolean, third: string }[cursor]) {}`,
        expected: `interface Extracted {
  first: number;
  second: boolean;
  third: string;
}

function doSomething(options: Extracted) {}`
      });
    });

    it("type literal", () => {
      shouldExtractType({
        code: `type Context = {[cursor]
  state: "reading";
  value: string
}`,
        expected: `type [cursor]Extracted = {
  state: "reading";
  value: string;
};

type Context = Extracted;`
      });
    });

    it("type literal in a union type", () => {
      shouldExtractType({
        code: `type Context =
  | { value: string }
  | {[cursor]
      value: string;
      draftValue: string;
    };`,
        expected: `type [cursor]Extracted = {
  value: string;
  draftValue: string;
};

type Context =
  { value: string } | Extracted;`
      });
    });

    it("type literal in a union type (infer name from first string literal)", () => {
      shouldExtractType({
        code: `type Context =
  | { state: "reading"; value: string }
  | {[cursor]
      state: "is editing";
      value: string;
      draftValue: string;
    };`,
        expected: `type [cursor]IsEditingContext = {
  state: "is editing";
  value: string;
  draftValue: string;
};

type Context =
  { state: "reading"; value: string } | IsEditingContext;`
      });
    });
  });

  describe("should not extract", () => {
    it("should show an error message if refactoring can't be made", () => {
      const code = `// This is a comment, can't be refactored`;
      const editor = new InMemoryEditor(code);
      const result = extractType({
        state: "new",
        code: editor.code,
        selection: editor.selection,
        highlightSources: []
      });

      expect(result.action).toBe("show error");
    });

    it("left side of an as expression", () => {
      const code = `console.log(person[cursor] as { name: string });`;
      const editor = new InMemoryEditor(code);

      const result = extractType({
        state: "new",
        code: editor.code,
        selection: editor.selection,
        highlightSources: []
      });

      expect(result.action).toBe("show error");
    });
  });

  it("should rename identifier (type)", () => {
    const editor = new InMemoryEditor(`let hello: stri[cursor]ng;`);
    const result = extractType({
      state: "new",
      code: editor.code,
      selection: editor.selection,
      highlightSources: []
    });

    expect(result).toMatchObject({
      action: "write",
      code: `type Extracted = string;
let hello: Extracted;`,
      newCursorPosition: Selection.cursorAt(0, 5).start,
      thenRun: expect.any(Function)
    });
  });

  it("should rename identifier (interface)", () => {
    const editor = new InMemoryEditor(`const hey = "ho";
let hello: [start]{
  world: string;
  morning: boolean;
}[end];`);
    const result = extractType({
      state: "new",
      code: editor.code,
      selection: editor.selection,
      highlightSources: []
    });

    expect(result).toMatchObject({
      action: "write",
      code: `const hey = "ho";

interface Extracted {
  world: string;
  morning: boolean;
}

let hello: Extracted;`,
      newCursorPosition: new Position(2, 10),
      thenRun: expect.any(Function)
    });
  });
});

function shouldExtractType({ code, expected }: { code: Code; expected: Code }) {
  const editor = new InMemoryEditor(code);
  const result = extractType({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });

  const { code: expectedCode, selection: expectedSelection } =
    new InMemoryEditor(expected);

  expect(result).toMatchObject({
    action: "write",
    code: expectedCode
  });

  if (!expectedSelection.isCursorAtTopOfDocument) {
    expect(result).toMatchObject({
      newCursorPosition: expectedSelection.start
    });
  }
}
