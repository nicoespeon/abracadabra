import { Editor, Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { Position } from "../../editor/position";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";

import { extractVariable, ReplaceChoice } from "./extract-variable";

describe("Extract Variable - Multiple occurrences", () => {
  let askUser: Editor["askUser"];

  beforeEach(() => {
    askUser = jest.fn();
  });

  it("should not ask the user if there is only one occurrence", async () => {
    const code = `console.log("Hello");`;
    const selection = Selection.cursorAt(0, 15);

    await doExtractVariable(code, selection);

    expect(askUser).not.toBeCalled();
  });

  it("should ask the user what to replace if there are multiple occurrences", async () => {
    const code = `console.log("Hello");
sendMessage("Hello");`;
    const selection = Selection.cursorAt(0, 15);

    await doExtractVariable(code, selection);

    expect(askUser).toBeCalledWith([
      {
        value: ReplaceChoice.AllOccurrences,
        label: "Replace all 2 occurrences"
      },
      {
        value: ReplaceChoice.ThisOccurrence,
        label: "Replace this occurrence only"
      }
    ]);
  });

  it("should stop extraction if user doesn't select a choice", async () => {
    const code = `console.log("Hello");
sendMessage("Hello");`;
    const selection = Selection.cursorAt(0, 15);
    askUser = jest.fn(() => Promise.resolve(undefined));

    const result = await doExtractVariable(code, selection);

    expect(result.code).toBe(code);
  });

  it("should extract only selected occurrence if user says so", async () => {
    const code = `console.log("Hello");
sendMessage("Hello");`;
    const selection = Selection.cursorAt(0, 15);
    askUser = jest.fn(([_, this_occurrence]) =>
      Promise.resolve(this_occurrence)
    );

    const result = await doExtractVariable(code, selection);

    const expectedCode = `const extracted = "Hello";
console.log(extracted);
sendMessage("Hello");`;
    expect(result.code).toBe(expectedCode);
  });

  it("should extract all occurrences if user says so", async () => {
    const code = `console.log("Hello");
sendMessage("Hello");`;
    const selection = Selection.cursorAt(0, 15);
    askUser = jest.fn(([all_occurrence]) => Promise.resolve(all_occurrence));

    const result = await doExtractVariable(code, selection);

    const expectedCode = `const extracted = "Hello";
console.log(extracted);
sendMessage(extracted);`;
    expect(result.code).toBe(expectedCode);
  });

  it("should put the extraction above the top most occurrence", async () => {
    const code = `console.log("Hello");
sendMessage("Hello");`;
    const selection = Selection.cursorAt(1, 15);
    askUser = jest.fn(([all_occurrence]) => Promise.resolve(all_occurrence));

    const result = await doExtractVariable(code, selection);

    const expectedCode = `const extracted = "Hello";
console.log(extracted);
sendMessage(extracted);`;
    expect(result.code).toBe(expectedCode);
  });

  it("should only extract occurrences in the scope of selected one", async () => {
    const code = `function sayHello() {
  track("said", "Hello");
  console.log("Hello");
}

sendMessage("Hello");`;
    const selection = Selection.cursorAt(1, 18);
    askUser = jest.fn(([all_occurrence]) => Promise.resolve(all_occurrence));

    const result = await doExtractVariable(code, selection);

    const expectedCode = `function sayHello() {
  const extracted = "Hello";
  track("said", extracted);
  console.log(extracted);
}

sendMessage("Hello");`;
    expect(result.code).toBe(expectedCode);
  });

  // TODO: test all types of extracted variables

  async function doExtractVariable(
    code: Code,
    selection: Selection
  ): Promise<{ code: Code; position: Position }> {
    const editor = new InMemoryEditor(code);
    editor.askUser = askUser;
    await extractVariable(code, selection, editor);
    return { code: editor.code, position: editor.position };
  }
});
