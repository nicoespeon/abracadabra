import { DelegateToEditor, EditorCommand } from "./i-delegate-to-editor";
import { WriteUpdates } from "./i-write-updates";
import { extractVariable } from "./extract-variable";
import { Selection } from "./selection";

describe("Extract Variable", () => {
  let delegateToEditor: DelegateToEditor;
  let writeUpdates: WriteUpdates;

  beforeEach(() => {
    delegateToEditor = jest.fn();
    writeUpdates = jest.fn();
  });

  describe("one string literal", () => {
    const code = `import logger from "./logger";

logger("Hello!");`;
    const selection = new Selection([2, 7], [2, 15]);

    it("should extract selected string into a variable", async () => {
      await extractVariable(code, selection, writeUpdates, delegateToEditor);

      expect(writeUpdates).toBeCalledWith([
        {
          code: 'const extracted = "Hello!";\n',
          selection: new Selection([2, 0], [2, 0])
        },
        { code: "extracted", selection }
      ]);
    });

    it("should rename extracted symbol", async () => {
      await extractVariable(code, selection, writeUpdates, delegateToEditor);

      expect(delegateToEditor).toBeCalledTimes(1);
      expect(delegateToEditor).toBeCalledWith(EditorCommand.RenameSymbol);
    });
  });

  it("should extract the correct string into a variable", async () => {
    const code = `import logger from "./logger";

logger("Hello");
logger("the", "World!", "Alright.");
logger("How are you doing?");`;
    const selection = new Selection([3, 14], [3, 22]);

    await extractVariable(code, selection, writeUpdates, delegateToEditor);

    expect(writeUpdates).toBeCalledWith([
      {
        code: 'const extracted = "World!";\n',
        selection: new Selection([3, 0], [3, 0])
      },
      { code: "extracted", selection }
    ]);
  });

  it("should extract a nested string with correct indentation", async () => {
    const code = `import logger from "./logger";

function sayHello() {
  logger("Hello!");
}`;
    const selection = new Selection([3, 9], [3, 17]);

    await extractVariable(code, selection, writeUpdates, delegateToEditor);

    expect(writeUpdates).toBeCalledWith([
      {
        code: 'const extracted = "Hello!";\n  ',
        selection: new Selection([3, 2], [3, 2])
      },
      { code: "extracted", selection }
    ]);
  });

  it("should select string where cursor is for extraction", async () => {
    const code = `import logger from "./logger";

logger("Hello!");`;
    const selection = new Selection([2, 9], [2, 9]);

    await extractVariable(code, selection, writeUpdates, delegateToEditor);

    expect(writeUpdates).toBeCalledWith([
      {
        code: 'const extracted = "Hello!";\n',
        selection: new Selection([2, 0], [2, 0])
      },
      { code: "extracted", selection: new Selection([2, 7], [2, 15]) }
    ]);
  });
});
