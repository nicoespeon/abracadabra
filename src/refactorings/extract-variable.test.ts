import { DelegateToEditor, EditorCommand } from "./i-delegate-to-editor";
import { WriteUpdates } from "./i-write-updates";
import { extractVariable } from "./extract-variable";
import { Selection } from "./selection";

const ONE_STRING_LITERAL = {
  code: `import logger from "./logger";

logger("Hello!");`,
  selection: new Selection([2, 7], [2, 15])
};
const MANY_STRING_LITERALS = {
  code: `import logger from "./logger";

logger("Hello");
logger("World!");
logger("How are you doing?");`,
  selection: new Selection([3, 7], [3, 15])
};

describe("Extract Variable", () => {
  let delegateToEditor: DelegateToEditor;
  let writeUpdates: WriteUpdates;

  beforeEach(() => {
    delegateToEditor = jest.fn();
    writeUpdates = jest.fn();
  });

  it("should extract selected string into a variable", async () => {
    const { code, selection } = ONE_STRING_LITERAL;

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
    const { code, selection } = ONE_STRING_LITERAL;

    await extractVariable(code, selection, writeUpdates, delegateToEditor);

    expect(delegateToEditor).toBeCalledTimes(1);
    expect(delegateToEditor).toBeCalledWith(EditorCommand.RenameSymbol);
  });

  it("should extract the correct string into a variable", async () => {
    const { code, selection } = MANY_STRING_LITERALS;

    await extractVariable(code, selection, writeUpdates, delegateToEditor);

    expect(writeUpdates).toBeCalledWith([
      {
        code: 'const extracted = "World!";\n',
        selection: new Selection([3, 0], [3, 0])
      },
      { code: "extracted", selection }
    ]);
  });
});
