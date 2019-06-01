import { DelegateToEditor, EditorCommand } from "./i-delegate-to-editor";
import { WriteUpdates } from "./i-write-updates";
import { extractVariable } from "./extract-variable";

const BASIC_SCENARIO = {
  code: `import logger from "./logger";

  logger("Hello!");`,
  selection: {
    start: { line: 2, character: 7 },
    end: { line: 2, character: 15 }
  }
};

describe("Extract Variable", () => {
  let delegateToEditor: DelegateToEditor;
  let writeUpdates: WriteUpdates;

  beforeEach(() => {
    delegateToEditor = jest.fn();
    writeUpdates = jest.fn();
  });

  it("should extract selected string into a variable", async () => {
    const { code, selection } = BASIC_SCENARIO;

    await extractVariable(code, selection, writeUpdates, delegateToEditor);

    const expectedSelectionForExtracted = {
      start: { line: 2, character: 0 },
      end: { line: 2, character: 0 }
    };
    expect(writeUpdates).toBeCalledWith([
      {
        code: 'const extracted = "Hello!";\n',
        selection: expectedSelectionForExtracted
      },
      { code: "extracted", selection }
    ]);
  });

  it("should rename extracted symbol", async () => {
    const { code, selection } = BASIC_SCENARIO;

    await extractVariable(code, selection, writeUpdates, delegateToEditor);

    expect(delegateToEditor).toBeCalledTimes(1);
    expect(delegateToEditor).toBeCalledWith(EditorCommand.RenameSymbol);
  });
});
