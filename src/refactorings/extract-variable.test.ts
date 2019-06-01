import { extractVariable } from "./extract-variable";

describe("Extract Variable", () => {
  it("should extract selected string into a variable", () => {
    const code = `import logger from "./logger";

logger("Hello!");`;
    const selection = {
      start: { line: 2, character: 7 },
      end: { line: 2, character: 15 }
    };
    const writeUpdates = jest.fn();

    extractVariable(code, selection, writeUpdates);

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
});
