import { DelegateToEditor, EditorCommand } from "./i-delegate-to-editor";
import { WritableEditor, Code, Update } from "./i-write-updates";
import { ShowErrorMessage, ErrorReason } from "./i-show-error-message";
import { extractVariable } from "./extract-variable";
import { Selection } from "./selection";

class WritableFakeEditor implements Mockify<WritableEditor> {
  write = jest.fn();
  read = jest.fn();
}

type Mockify<T> = { [P in keyof T]: jest.Mock<{}> };

describe("Extract Variable", () => {
  let delegateToEditor: DelegateToEditor;
  let showErrorMessage: ShowErrorMessage;
  let editor: WritableFakeEditor;

  beforeEach(() => {
    delegateToEditor = jest.fn();
    showErrorMessage = jest.fn();
    editor = new WritableFakeEditor();
  });

  describe("basic extraction", () => {
    const extractableCode = '"Hello!"';
    const code = `import logger from "./logger";

logger(${extractableCode});`;
    const extractableSelection = selectionFor([2, 7], extractableCode);

    it("should read code from extractable selection", async () => {
      await doExtractVariable(code, extractableSelection, extractableCode);

      expect(editor.read).toBeCalledWith(extractableSelection);
    });

    it("should read code from extractable selection when selection is inside extractable code", async () => {
      const selectionInExtractableCode = new Selection([2, 9], [2, 9]);

      await doExtractVariable(
        code,
        selectionInExtractableCode,
        extractableCode
      );

      expect(editor.read).toBeCalledWith(extractableSelection);
    });

    it("should update code to extract selection into a variable", async () => {
      await doExtractVariable(code, extractableSelection, extractableCode);

      expect(editor.write).toBeCalledWith([
        {
          code: `const extracted = ${extractableCode};\n`,
          selection: new Selection([2, 0], [2, 0])
        },
        { code: "extracted", selection: extractableSelection }
      ]);
    });

    it("should rename extracted symbol", async () => {
      await doExtractVariable(code, extractableSelection, extractableCode);

      expect(delegateToEditor).toBeCalledTimes(1);
      expect(delegateToEditor).toBeCalledWith(EditorCommand.RenameSymbol);
    });

    describe("invalid selection", () => {
      const invalidSelection = selectionFor([2, 1], extractableCode);

      it("should not extract anything", async () => {
        await doExtractVariable(code, invalidSelection, extractableCode);

        expect(editor.write).not.toBeCalled();
      });

      it("should show an error message", async () => {
        await doExtractVariable(code, invalidSelection, extractableCode);

        expect(showErrorMessage).toBeCalledWith(
          ErrorReason.DidNotFoundExtractedCode
        );
      });
    });
  });

  it("should extract the correct variable when we have many", async () => {
    const extractableCode = '"World!"';
    const code = `console.log("Hello");
console.log("the", ${extractableCode}, "Alright.");
console.log("How are you doing?");`;
    const extractableSelection = selectionFor([1, 19], extractableCode);

    await doExtractVariable(code, extractableSelection, extractableCode);

    expect(editor.write).toBeCalledWith([
      {
        code: `const extracted = ${extractableCode};\n`,
        selection: new Selection([1, 0], [1, 0])
      },
      { code: "extracted", selection: extractableSelection }
    ]);
  });

  it("should extract with correct indentation", async () => {
    const extractableCode = '"Hello!"';
    const code = `
    function sayHello() {
      console.log(${extractableCode});
    }`;
    const extractableSelection = selectionFor([2, 18], extractableCode);

    await doExtractVariable(code, extractableSelection, extractableCode);

    const expectedIndentationLevel = 6;
    const expectedIndentation = " ".repeat(expectedIndentationLevel);
    const expectedCursorPosition = [2, expectedIndentationLevel];
    const [extractedUpdate]: Update[] = editor.write.mock.calls[0][0];
    expect(extractedUpdate.code.endsWith(expectedIndentation)).toBe(true);
    expect(extractedUpdate.selection).toStrictEqual(
      new Selection(expectedCursorPosition, expectedCursorPosition)
    );
  });

  shouldExtractA("string", "'Hello!'");
  shouldExtractA("number", "12.5");
  shouldExtractA("boolean", "false");
  shouldExtractA("null", "null");
  shouldExtractA("undefined", "undefined");
  shouldExtractA("array", "[1, 2, 'three', [true, null]]");
  shouldExtractA("object", "{ one: 1, foo: true, hello: 'World!' }");
  shouldExtractA(
    "object (multi-lines)",
    `{
  one: 1,
  foo: true,
  hello: 'World!'
}`
  );

  it(`should extract a "object (multi-lines)" at correct selection when cursor is inside`, async () => {
    const extractableCode = `{
  one: 1,
  foo: true,
  hello: 'World!'
}`;
    const code = `console.log(${extractableCode});`;
    const selectionInExtractableCode = new Selection([2, 3], [2, 3]);

    await doExtractVariable(code, selectionInExtractableCode, extractableCode);

    expect(editor.write).toBeCalledTimes(1);
    const [extractedUpdate]: Update[] = editor.write.mock.calls[0][0];
    expect(extractedUpdate.selection).toStrictEqual(
      new Selection([0, 0], [0, 0])
    );
  });

  function shouldExtractA(type: string, value: string) {
    it(`should extract a "${type}"`, async () => {
      const extractableCode = `${value}`;
      const code = `console.log(${extractableCode});`;
      const extractableSelection = new Selection([0, 12], [0, 12]);

      await doExtractVariable(code, extractableSelection, extractableCode);

      expect(editor.write).toBeCalledTimes(1);
      const [extractedUpdate]: Update[] = editor.write.mock.calls[0][0];
      expect(extractedUpdate.code).toBe(
        `const extracted = ${extractableCode};\n`
      );
    });
  }

  function selectionFor([line, char]: number[], code: string): Selection {
    return new Selection([line, char], [line, char + code.length]);
  }

  function doExtractVariable(code: Code, selection: Selection, readCode = "") {
    editor.read.mockReturnValue(readCode);

    return extractVariable(
      code,
      selection,
      editor,
      delegateToEditor,
      showErrorMessage
    );
  }
});
