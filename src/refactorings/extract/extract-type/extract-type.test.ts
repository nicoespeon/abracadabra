import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { Code, Command, ErrorReason } from "../../../editor/editor";
import { testEach } from "../../../tests-helpers";

import { Selection } from "../../../editor/selection";
import { extractType } from "./extract-type";

describe("Extract Type", () => {
  testEach<{ code: Code; expected: Code }>(
    "should extract type",
    [
      {
        description: "basic scenario",
        code: `let something: number[cursor];`,
        expected: `type Extracted = number;
let something: Extracted;`
      },
      {
        description: "selected type only",
        code: `let something: number[cursor];
let somethingElse: string;`,
        expected: `type Extracted = number;
let something: Extracted;
let somethingElse: string;`
      },
      {
        description: "create interface if extracted type is an object",
        code: `let something: [start]{ hello: string; }[end];`,
        expected: `interface Extracted {
  hello: string;
}

let something: Extracted;`
      },
      {
        description: "with comment above",
        code: `// Hello there!
let something: number[cursor];`,
        expected: `type [cursor]Extracted = number;
// Hello there!
let something: Extracted;`
      },
      {
        description: "closest scope from (A | B)",
        code: `let something: boolean | number[cursor] | string;`,
        expected: `type [cursor]Extracted = number;
let something: boolean | Extracted | string;`
      },
      {
        description: "closest scope from (A & B)",
        code: `let something: Hello[cursor] & World;`,
        expected: `type [cursor]Extracted = Hello;
let something: Extracted & World;`
      },
      {
        description: "closest scope from (A & B | C)",
        code: `let something: Hello[start] & World[end] | boolean;`,
        expected: `type [cursor]Extracted = Hello & World;
let something: Extracted | boolean;`
      },
      {
        description: "nested type",
        code: `let something: { response: { data: string[cursor]; } };`,
        expected: `type [cursor]Extracted = string;
let something: { response: { data: Extracted; } };`
      },
      {
        description: "nested interface",
        code: `let something: { response: [start]{ data: string[end]; } };`,
        expected: `interface [cursor]Extracted {
  data: string;
}

let something: { response: Extracted };`
      },
      {
        description: "as expression",
        code: `console.log(person as [cursor]{ name: string });`,
        expected: `interface [cursor]Extracted {
  name: string;
}

console.log(person as Extracted);`
      },
      {
        description: "type parameter of a call expression",
        code: `doSomething<[cursor]string, number>(someVariable);`,
        expected: `type [cursor]Extracted = string;
doSomething<Extracted, number>(someVariable);`
      },
      {
        description:
          "nested type parameter of a call expression (cursor on nested)",
        code: `doSomething<Array<[cursor]string>>(someVariable);`,
        expected: `type [cursor]Extracted = string;
doSomething<Array<Extracted>>(someVariable);`
      },
      {
        description:
          "nested type parameter of a call expression (cursor on parent)",
        code: `doSomething<[cursor]Array<string>>(someVariable);`,
        expected: `type [cursor]Extracted = Array<string>;
doSomething<Extracted>(someVariable);`
      },
      {
        description: "TS type query",
        code: `type Context = ContextFrom<typeof [cursor]someMachineModel>;`,
        expected: `type [cursor]Extracted = typeof someMachineModel;
type Context = ContextFrom<Extracted>;`
      },
      {
        description: "TS union type",
        code: `const someMachine = createMachine<
  C<typeof someModel>,
  M<typeof commonModel> [cursor]| M<typeof someModel>
>()`,
        expected: `type [cursor]Extracted = M<typeof commonModel> | M<typeof someModel>;
const someMachine = createMachine<C<typeof someModel>, Extracted>()`
      },
      {
        description: "TS intersection type",
        code: `const someMachine = createMachine<
  C<typeof someModel>,
  M<typeof commonModel> [cursor]& M<typeof someModel>
>()`,
        expected: `type [cursor]Extracted = M<typeof commonModel> & M<typeof someModel>;
const someMachine = createMachine<C<typeof someModel>, Extracted>()`
      },
      {
        description: "object type using commas",
        code: `function doSomething(options: { first: number, second: boolean, third: string }[cursor]) {}`,
        expected: `interface Extracted {
  first: number;
  second: boolean;
  third: string;
}

function doSomething(options: Extracted) {}`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await extractType(editor);

      const { code: expectedCode, selection: expectedSelection } =
        new InMemoryEditor(expected);

      expect(editor.code).toBe(expectedCode);
      if (!expectedSelection.isCursorAtTopOfDocument) {
        expect(editor.selection).toStrictEqual(expectedSelection);
      }
    }
  );

  testEach<{ code: Code }>(
    "should not extract",
    [
      {
        description: "left side of an as expression",
        code: `console.log(person[cursor] as { name: string });`
      }
    ],
    async ({ code }) => {
      const editor = new InMemoryEditor(code);
      const originalCode = editor.code;

      await extractType(editor);

      expect(editor.code).toBe(originalCode);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await extractType(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindTypeToExtract
    );
  });

  it("should rename identifier (type)", async () => {
    const editor = new InMemoryEditor(`let hello: stri[cursor]ng;`);
    jest.spyOn(editor, "delegate");

    await extractType(editor);

    expect(editor.delegate).toHaveBeenNthCalledWith(1, Command.RenameSymbol);
    expect(editor.code).toEqual(`type Extracted = string;
let hello: Extracted;`);
    expect(editor.selection).toStrictEqual(Selection.cursorAt(0, 5));
  });

  it("should rename identifier (interface)", async () => {
    const editor = new InMemoryEditor(`const hey = "ho";
let hello: [start]{
  world: string;
  morning: boolean;
}[end];`);
    jest.spyOn(editor, "delegate");

    await extractType(editor);

    expect(editor.delegate).toHaveBeenNthCalledWith(1, Command.RenameSymbol);
    expect(editor.code).toEqual(`const hey = "ho";

interface Extracted {
  world: string;
  morning: boolean;
}

let hello: Extracted;`);
    expect(editor.selection).toStrictEqual(Selection.cursorAt(2, 10));
  });
});
