import { Editor, Code, Command, ErrorReason } from "../../../editor/editor";
import { Selection } from "../../../editor/selection";
import { Position } from "../../../editor/position";
import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";

import { extractVariable } from "./extract-variable";

describe("Extract Variable - Basic extraction behaviour", () => {
  let delegateToEditor: Editor["delegate"];
  let showErrorMessage: Editor["showError"];

  beforeEach(() => {
    delegateToEditor = jest.fn();
    showErrorMessage = jest.fn();
  });

  const code = `console.log("Hello!");`;
  const extractableSelection = new Selection([0, 12], [0, 20]);

  it("should update code with extractable selection", async () => {
    const result = await doExtractVariable(code, extractableSelection);

    expect(result.code).toBe(`const hello = "Hello!";
console.log(hello);`);
  });

  it("should expand selection to the nearest extractable code", async () => {
    const selectionInExtractableCode = Selection.cursorAt(0, 15);

    const result = await doExtractVariable(code, selectionInExtractableCode);

    expect(result.code).toBe(`const hello = "Hello!";
console.log(hello);`);
  });

  it("should rename extracted symbol", async () => {
    await doExtractVariable(code, extractableSelection);

    expect(delegateToEditor).toBeCalledTimes(1);
    expect(delegateToEditor).toBeCalledWith(Command.RenameSymbol);
  });

  it("should extract with correct indentation", async () => {
    const code = `    function sayHello() {
      console.log("Hello!");
    }`;
    const extractableSelection = new Selection([1, 18], [1, 26]);

    const result = await doExtractVariable(code, extractableSelection);

    expect(result.code).toBe(`    function sayHello() {
      const hello = "Hello!";
      console.log(hello);
    }`);
  });

  describe("invalid selection", () => {
    const invalidSelection = new Selection([0, 10], [0, 14]);

    it("should not extract anything", async () => {
      const result = await doExtractVariable(code, invalidSelection);

      expect(result.code).toBe(code);
    });

    it("should show an error message", async () => {
      await doExtractVariable(code, invalidSelection);

      expect(showErrorMessage).toBeCalledWith(
        ErrorReason.DidNotFindExtractableCode
      );
    });
  });

  async function doExtractVariable(
    code: Code,
    selection: Selection
  ): Promise<{ code: Code; position: Position }> {
    const editor = new InMemoryEditor(code);
    editor.showError = showErrorMessage;
    editor.delegate = delegateToEditor;
    await extractVariable(code, selection, editor);
    return { code: editor.code, position: editor.position };
  }
});
