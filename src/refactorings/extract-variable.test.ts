import { DelegateToEditor, EditorCommand } from "./i-delegate-to-editor";
import { WriteUpdates, Code, GetCode } from "./i-write-updates";
import { ShowErrorMessage, ErrorReason } from "./i-show-error-message";
import { extractVariable } from "./extract-variable";
import { Selection } from "./selection";

describe("Extract Variable", () => {
  let delegateToEditor: DelegateToEditor;
  let writeUpdates: WriteUpdates;
  let getCode: GetCode;
  let showErrorMessage: ShowErrorMessage;

  beforeEach(() => {
    delegateToEditor = jest.fn();
    writeUpdates = jest.fn();
    getCode = jest.fn().mockReturnValue("");
    showErrorMessage = jest.fn();
  });

  describe("basic extraction (one string literal)", () => {
    const code = `import logger from "./logger";

logger("Hello!");`;
    const selection = new Selection([2, 7], [2, 15]);

    it("should extract selected string into a variable", async () => {
      await doExtractVariable(code, selection);

      expect(writeUpdates).toBeCalledWith([
        {
          code: 'const extracted = "Hello!";\n',
          selection: new Selection([2, 0], [2, 0])
        },
        { code: "extracted", selection }
      ]);
    });

    it("should rename extracted symbol", async () => {
      await doExtractVariable(code, selection);

      expect(delegateToEditor).toBeCalledTimes(1);
      expect(delegateToEditor).toBeCalledWith(EditorCommand.RenameSymbol);
    });

    it("should select string where cursor is for extraction", async () => {
      const selection = new Selection([2, 9], [2, 9]);

      await doExtractVariable(code, selection);

      expect(writeUpdates).toBeCalledWith([
        {
          code: 'const extracted = "Hello!";\n',
          selection: new Selection([2, 0], [2, 0])
        },
        { code: "extracted", selection: new Selection([2, 7], [2, 15]) }
      ]);
    });

    describe("invalid selection", () => {
      const invalidSelection = new Selection([2, 1], [2, 3]);

      it("should not extract anything", async () => {
        await doExtractVariable(code, invalidSelection);

        expect(writeUpdates).not.toBeCalled();
      });

      it("should show an error message", async () => {
        await doExtractVariable(code, invalidSelection);

        expect(showErrorMessage).toBeCalledWith(
          ErrorReason.DidNotFoundExtractedCode
        );
      });
    });
  });

  it("should extract the correct variable when we have many", async () => {
    const code = `import logger from "./logger";

logger("Hello");
logger("the", "World!", "Alright.");
logger("How are you doing?");`;
    const selection = new Selection([3, 14], [3, 22]);

    await doExtractVariable(code, selection);

    expect(writeUpdates).toBeCalledWith([
      {
        code: 'const extracted = "World!";\n',
        selection: new Selection([3, 0], [3, 0])
      },
      { code: "extracted", selection }
    ]);
  });

  it("should extract a nested variable with correct indentation", async () => {
    const code = `import logger from "./logger";

function sayHello() {
  logger("Hello!");
}`;
    const selection = new Selection([3, 9], [3, 17]);

    await doExtractVariable(code, selection);

    expect(writeUpdates).toBeCalledWith([
      {
        code: 'const extracted = "Hello!";\n  ',
        selection: new Selection([3, 2], [3, 2])
      },
      { code: "extracted", selection }
    ]);
  });

  it("should extract a number", async () => {
    const code = "const x = 1 + 12.5;";
    const selection = new Selection([0, 14], [0, 18]);

    await doExtractVariable(code, selection);

    expect(writeUpdates).toBeCalledWith([
      {
        code: "const extracted = 12.5;\n",
        selection: new Selection([0, 0], [0, 0])
      },
      { code: "extracted", selection }
    ]);
  });

  it("should extract a boolean", async () => {
    const code = "console.log(false);";
    const selection = new Selection([0, 12], [0, 17]);

    await doExtractVariable(code, selection);

    expect(writeUpdates).toBeCalledWith([
      {
        code: "const extracted = false;\n",
        selection: new Selection([0, 0], [0, 0])
      },
      { code: "extracted", selection }
    ]);
  });

  it("should extract a null", async () => {
    const code = "console.log(null);";
    const selection = new Selection([0, 12], [0, 16]);

    await doExtractVariable(code, selection);

    expect(writeUpdates).toBeCalledWith([
      {
        code: "const extracted = null;\n",
        selection: new Selection([0, 0], [0, 0])
      },
      { code: "extracted", selection }
    ]);
  });

  it("should extract an undefined", async () => {
    const code = "console.log(undefined);";
    const selection = new Selection([0, 12], [0, 21]);

    await doExtractVariable(code, selection);

    expect(writeUpdates).toBeCalledWith([
      {
        code: "const extracted = undefined;\n",
        selection: new Selection([0, 0], [0, 0])
      },
      { code: "extracted", selection }
    ]);
  });

  it("should extract an array", async () => {
    const code = "console.log([1, 2, 'three']);";
    const selection = new Selection([0, 12], [0, 27]);

    await doExtractVariable(code, selection, "[1, 2, 'three']");

    expect(writeUpdates).toBeCalledWith([
      {
        code: "const extracted = [1, 2, 'three'];\n",
        selection: new Selection([0, 0], [0, 0])
      },
      { code: "extracted", selection }
    ]);
  });

  it("should get code with correct selection for arrays", async () => {
    const code = "console.log([1, 2, 'three']);";
    const selection = new Selection([0, 12], [0, 27]);

    await doExtractVariable(code, selection);

    expect(getCode).toBeCalledWith(selection);
  });

  it("should get code with correct selection for arrays when cursor is inside", async () => {
    const code = "console.log([1, 2, 'three']);";
    const selection = new Selection([0, 15], [0, 15]);

    await doExtractVariable(code, selection);

    expect(getCode).toBeCalledWith(new Selection([0, 12], [0, 27]));
  });

  function doExtractVariable(
    code: Code,
    selection: Selection,
    retrievedCode = ""
  ) {
    getCode = jest.fn().mockReturnValue(retrievedCode);

    return extractVariable(
      code,
      selection,
      writeUpdates,
      getCode,
      delegateToEditor,
      showErrorMessage
    );
  }
});
