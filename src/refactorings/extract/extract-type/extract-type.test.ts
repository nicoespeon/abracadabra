import { ErrorReason, Code, Command } from "../../../editor/editor";
import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { testEach } from "../../../tests-helpers";

import { extractType } from "./extract-type";
import { Selection } from "../../../editor/selection";

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
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await extractType(editor);

      const {
        code: expectedCode,
        selection: expectedSelection
      } = new InMemoryEditor(expected);

      expect(editor.code).toBe(expectedCode);
      if (!expectedSelection.isCursorAtTopOfDocument) {
        expect(editor.selection).toStrictEqual(expectedSelection);
      }
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
