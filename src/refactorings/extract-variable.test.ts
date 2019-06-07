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
    const code = `console.log(${extractableCode});`;
    const extractableSelection = selectionFor([0, 12], extractableCode);

    it("should read code from extractable selection", async () => {
      await doExtractVariable(code, extractableSelection, extractableCode);

      expect(editor.read).toBeCalledWith(extractableSelection);
    });

    it("should read code from extractable selection when selection is inside extractable code", async () => {
      const selectionInExtractableCode = new Selection([0, 15], [0, 16]);

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
          selection: new Selection([0, 0], [0, 0])
        },
        { code: "extracted", selection: extractableSelection }
      ]);
    });

    it("should rename extracted symbol", async () => {
      await doExtractVariable(code, extractableSelection, extractableCode);

      expect(delegateToEditor).toBeCalledTimes(1);
      expect(delegateToEditor).toBeCalledWith(EditorCommand.RenameSymbol);
    });

    it("should extract with correct indentation", async () => {
      const extractableCode = '"Hello!"';
      const code = `
    function sayHello() {
      console.log(${extractableCode});
    }`;
      const extractableSelection = selectionFor([2, 18], extractableCode);

      await doExtractVariable(code, extractableSelection, extractableCode);

      const [extractedUpdate]: Update[] = editor.write.mock.calls[0][0];
      expect(extractedUpdate.code.endsWith("      ")).toBe(true);
      expectSelectionIs(new Selection([2, 6], [2, 6]));
    });

    describe("invalid selection", () => {
      const invalidSelection = selectionFor([0, 10], extractableCode);

      it("should not extract anything", async () => {
        await doExtractVariable(code, invalidSelection, extractableCode);

        expect(editor.write).not.toBeCalled();
      });

      it("should show an error message", async () => {
        await doExtractVariable(code, invalidSelection, extractableCode);

        expect(showErrorMessage).toBeCalledWith(
          ErrorReason.DidNotFoundExtractableCode
        );
      });
    });
  });

  describe("simple extractions", () => {
    shouldExtractA("string", "'Hello!'");
    shouldExtractA("number", "12.5");
    shouldExtractA("boolean", "false");
    shouldExtractA("null", "null");
    shouldExtractA("undefined", "undefined");
    shouldExtractA("array", "[1, 2, 'three', [true, null]]");
    shouldExtractA(
      "array (multi-lines)",
      `[
  1,
  'Two',
  [true, null]
]`
    );
    shouldExtractA("object", "{ one: 1, foo: true, hello: 'World!' }");
    shouldExtractA(
      "object (multi-lines)",
      `{
  one: 1,
  foo: true,
  hello: 'World!'
}`
    );
    shouldExtractA(
      "named function",
      `function sayHello() {
  return "Hello!";
}`
    );
    shouldExtractA("anonymous function", `() => "Hello!"`);

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
  });

  describe("complex extractions", () => {
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

    it(`should extract a multi-lines object when cursor is inside`, async () => {
      const extractableCode = `{
  one: 1,
  foo: true,
  hello: 'World!'
}`;
      const code = `console.log(${extractableCode});`;
      const selectionInExtractableCode = new Selection([2, 3], [2, 3]);

      await doExtractVariable(
        code,
        selectionInExtractableCode,
        extractableCode
      );

      expectSelectionIs(new Selection([0, 0], [0, 0]));
    });

    it(`should extract an element nested in a multi-lines object`, async () => {
      const extractableCode = '"Hello!"';
      const code = `console.log({
  one: 1,
  foo: {
    bar: ${extractableCode}
  }
});`;
      const selectionInExtractableCode = selectionFor([3, 9], extractableCode);

      await doExtractVariable(
        code,
        selectionInExtractableCode,
        extractableCode
      );

      expectSelectionIs(new Selection([0, 0], [0, 0]));
    });

    it(`should extract an element nested in a multi-lines object that is assigned to a variable`, async () => {
      const extractableCode = '"Hello!"';
      const code = `const a = {
  one: 1,
  foo: {
    bar: ${extractableCode}
  }
};`;
      const selectionInExtractableCode = selectionFor([3, 9], extractableCode);

      await doExtractVariable(
        code,
        selectionInExtractableCode,
        extractableCode
      );

      expectSelectionIs(new Selection([0, 0], [0, 0]));
    });

    it(`should extract an element nested in a multi-lines array`, async () => {
      const extractableCode = '"Hello!"';
      const code = `console.log([
  1,
  [
    {
      hello: ${extractableCode}
    }
  ]
]);`;
      const selectionInExtractableCode = selectionFor([3, 13], extractableCode);

      await doExtractVariable(
        code,
        selectionInExtractableCode,
        extractableCode
      );

      expectSelectionIs(new Selection([0, 0], [0, 0]));
    });

    it(`should extract the whole object when cursor is on its property`, async () => {
      const extractableCode = '{ foo: "bar", one: true }';
      const code = `console.log(${extractableCode});`;
      const selectionOnProperty = new Selection([0, 16], [0, 16]);

      await doExtractVariable(code, selectionOnProperty, extractableCode);

      expect(editor.read).toBeCalledWith(
        selectionFor([0, 12], extractableCode)
      );
    });

    it(`should extract a computed object property`, async () => {
      const extractableCode = `key`;
      const code = `const a = { [${extractableCode}]: "value" }`;
      const extractableSelection = selectionFor([0, 13], extractableCode);

      await doExtractVariable(code, extractableSelection, extractableCode);

      expect(editor.read).toBeCalledWith(extractableSelection);
    });

    it(`should extract computed object property value when cursor is on value`, async () => {
      const extractableCode = `"value"`;
      const code = `const a = { [key]: ${extractableCode} }`;
      const extractableSelection = selectionFor([0, 19], extractableCode);

      await doExtractVariable(code, extractableSelection, extractableCode);

      expect(editor.read).toBeCalledWith(extractableSelection);
    });

    it(`should extract the whole object when cursor is on a method declaration`, async () => {
      const extractableCode = `{
  getFoo() {
    return "bar";
  }
}`;
      const code = `console.log(${extractableCode});`;
      const selectionOnProperty = new Selection([1, 2], [1, 8]);

      await doExtractVariable(code, selectionOnProperty, extractableCode);

      expect(editor.read).toBeCalledWith(new Selection([0, 12], [4, 1]));
    });

    it(`should extract the nested object when cursor is on nested object property`, async () => {
      const extractableCode = "{ bar: true }";
      const code = `console.log({ foo: ${extractableCode} });`;
      const selectionOnNestedProperty = new Selection([0, 21], [0, 21]);

      await doExtractVariable(code, selectionOnNestedProperty, extractableCode);

      expect(editor.read).toBeCalledWith(
        selectionFor([0, 19], extractableCode)
      );
    });

    it(`should extract a valid path when cursor is on a part of member expression`, async () => {
      const code = `console.log(path.node.name)`;
      const selectionOnProperty = new Selection([0, 17], [0, 17]);

      await doExtractVariable(code, selectionOnProperty);

      expect(editor.read).toBeCalledWith(new Selection([0, 12], [0, 21]));
    });

    it(`should extract a return value of a function`, async () => {
      const extractableCode = `"Hello!"`;
      const code = `function getMessage() {
  return ${extractableCode};
}`;
      const extractableSelection = selectionFor([1, 9], extractableCode);

      await doExtractVariable(code, extractableSelection, extractableCode);

      expect(editor.write).toBeCalledTimes(1);
      const [extractedUpdate]: Update[] = editor.write.mock.calls[0][0];
      expect(extractedUpdate.code).toBe(
        `const extracted = ${extractableCode};\n  `
      );
    });

    it(`should extract an assigned variable`, async () => {
      const extractableCode = `"Hello!"`;
      const code = `const message = ${extractableCode};`;
      const extractableSelection = selectionFor([0, 16], extractableCode);

      await doExtractVariable(code, extractableSelection, extractableCode);

      expect(editor.write).toBeCalledTimes(1);
      const [extractedUpdate]: Update[] = editor.write.mock.calls[0][0];
      expect(extractedUpdate.code).toBe(
        `const extracted = ${extractableCode};\n`
      );
    });

    it(`should extract a class property assignment`, async () => {
      const extractableCode = `"Hello!"`;
      const code = `class Logger {
  message = ${extractableCode};
}`;
      const extractableSelection = selectionFor([1, 12], extractableCode);

      await doExtractVariable(code, extractableSelection, extractableCode);

      expect(editor.write).toBeCalledTimes(1);
      const [extractedUpdate]: Update[] = editor.write.mock.calls[0][0];
      expect(extractedUpdate.code).toBe(
        `const extracted = ${extractableCode};\n`
      );
    });

    it(`should extract a computed class property`, async () => {
      const extractableCode = `key`;
      const code = `class Logger {
  [${extractableCode}] = "value";
}`;
      const extractableSelection = selectionFor([1, 3], extractableCode);

      await doExtractVariable(code, extractableSelection, extractableCode);

      expect(editor.write).toBeCalledTimes(1);
      const [extractedUpdate]: Update[] = editor.write.mock.calls[0][0];
      expect(extractedUpdate.code).toBe(
        `const extracted = ${extractableCode};\n`
      );
    });

    it(`should extract an interpolated string when cursor is on a subpart of it`, async () => {
      const extractableCode = "`Hello ${world}! How are you doing?`";
      const code = `console.log(${extractableCode})`;
      const extractableSelection = new Selection([0, 15], [0, 15]);

      await doExtractVariable(code, extractableSelection);

      expect(editor.read).toBeCalledWith(
        selectionFor([0, 12], extractableCode)
      );
    });

    it(`should extract an if statement`, async () => {
      const extractableCode = "parents.length > 0 && type === 'refactor'";
      const code = `if (${extractableCode}) doSomething()`;
      const extractableSelection = selectionFor([0, 4], extractableCode);

      await doExtractVariable(code, extractableSelection);

      expect(editor.read).toBeCalledWith(extractableSelection);
    });

    it(`should extract a multi-line if statement`, async () => {
      const code = `if (
  parents.length > 0 &&
  type === 'refactor'
) doSomething()`;
      const extractableSelection = new Selection([1, 2], [2, 21]);

      await doExtractVariable(code, extractableSelection);

      expect(editor.read).toBeCalledWith(extractableSelection);
      expectSelectionIs(new Selection([0, 0], [0, 0]));
    });

    it(`should extract a part of a multi-line if statement`, async () => {
      const code = `if (
  parents.length > 0 &&
  type === 'refactor'
) doSomething()`;
      const extractableSelection = new Selection([2, 2], [2, 21]);

      await doExtractVariable(code, extractableSelection);

      expect(editor.read).toBeCalledWith(extractableSelection);
      expectSelectionIs(new Selection([0, 0], [0, 0]));
    });

    it(`should extract a while statement`, async () => {
      const extractableCode = "parents.length > 0 && type === 'refactor'";
      const code = `while (${extractableCode}) doSomething()`;
      const extractableSelection = selectionFor([0, 7], extractableCode);

      await doExtractVariable(code, extractableSelection);

      expect(editor.read).toBeCalledWith(extractableSelection);
    });

    it(`should extract a case statement`, async () => {
      const extractableCode = "'Hello'";
      const code = `switch (text) {
  case ${extractableCode}:
  default:
    break;
}`;
      const extractableSelection = selectionFor([1, 7], extractableCode);

      await doExtractVariable(code, extractableSelection);

      expect(editor.read).toBeCalledWith(extractableSelection);
      expectSelectionIs(new Selection([0, 0], [0, 0]));
    });

    it(`should extract an unamed function parameter when cursor is inside`, async () => {
      const extractableCode = `function () {
  return "Hello!";
}`;
      const code = `console.log(${extractableCode})`;
      const extractableSelection = new Selection([1, 0], [1, 0]);

      await doExtractVariable(code, extractableSelection);

      expect(editor.read).toBeCalledWith(new Selection([0, 12], [2, 1]));
      expectSelectionIs(new Selection([0, 0], [0, 0]));
    });
  });

  describe("invalid extractions", () => {
    it(`should not extract a function declaration`, async () => {
      const code = `function sayHello() {
  console.log("hello");
}`;
      const selectionInExtractableCode = new Selection([0, 0], [2, 1]);

      await doExtractVariable(code, selectionInExtractableCode);

      expect(editor.write).not.toBeCalled();
    });

    it(`should not extract a class property identifier`, async () => {
      const code = `class Logger {
  message = "Hello!";
}`;
      const extractableSelection = new Selection([1, 2], [1, 9]);

      await doExtractVariable(code, extractableSelection);

      expect(editor.write).not.toBeCalled();
    });

    it(`should not extract the identifier from a variable declaration`, async () => {
      const code = `const foo = "bar";`;
      const extractableSelection = new Selection([0, 6], [0, 9]);

      await doExtractVariable(code, extractableSelection);

      expect(editor.write).not.toBeCalled();
    });
  });

  function expectSelectionIs(expectedSelection: Selection) {
    expect(editor.write).toBeCalledTimes(1);

    const [extractedUpdate]: Update[] = editor.write.mock.calls[0][0];
    expect(extractedUpdate.selection).toStrictEqual(expectedSelection);
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
