import { DelegateToEditor, EditorCommand } from "./i-delegate-to-editor";
import { WriteUpdates } from "./i-write-updates";
import { extractVariable } from "./extract-variable";
import { createSelection } from "./selection";

const BASIC_SCENARIO = {
  code: `import logger from "./logger";

  logger("Hello!");`,
  selection: createSelection([2, 7], [2, 15])
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

    expect(writeUpdates).toBeCalledWith([
      {
        code: 'const extracted = "Hello!";\n',
        selection: createSelection([2, 0], [2, 0])
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
