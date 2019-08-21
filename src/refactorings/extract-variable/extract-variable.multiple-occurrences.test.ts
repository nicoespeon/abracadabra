import { Editor, Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { Position } from "../../editor/position";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";

import { extractVariable, ReplaceChoice } from "./extract-variable";
import { testEach } from "../../tests-helpers";

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

  testEach<{ code: Code; selection?: Selection; expected: Code }>(
    "should extract variables of type",
    [
      {
        description: "string",
        code: `console.log("Hello");
sendMessage("Hello");`,
        expected: `const extracted = "Hello";
console.log(extracted);
sendMessage(extracted);`
      },
      {
        description: "number",
        code: `console.log(10);
sendMessage(10);`,
        expected: `const extracted = 10;
console.log(extracted);
sendMessage(extracted);`
      },
      {
        description: "boolean",
        code: `console.log(true);
sendMessage(true);`,
        expected: `const extracted = true;
console.log(extracted);
sendMessage(extracted);`
      },
      {
        description: "null",
        code: `console.log(null);
sendMessage(null);`,
        expected: `const extracted = null;
console.log(extracted);
sendMessage(extracted);`
      },
      {
        description: "undefined",
        code: `console.log(undefined);
sendMessage(undefined);`,
        expected: `const extracted = undefined;
console.log(extracted);
sendMessage(extracted);`
      },
      {
        description: "array",
        code: `console.log([1, 3, 4]);
sendMessage([1, 3, 4]);`,
        expected: `const extracted = [1, 3, 4];
console.log(extracted);
sendMessage(extracted);`
      },
      {
        description: "object",
        code: `console.log({ one: 1, foo: "bar" });
sendMessage({ one: 1, foo: "bar" });`,
        expected: `const extracted = { one: 1, foo: "bar" };
console.log(extracted);
sendMessage(extracted);`
      },
      {
        description: "object",
        code: `console.log([
  {
    one: 1,
    foo: "bar",
    elements: [[1, 2], "hello"]
  }
]);
sendMessage([
  {
    one: 1,
    foo: "bar",
    elements: [[1, 2], "hello"]
  }
]);`,
        expected: `const extracted = [
  {
    one: 1,
    foo: "bar",
    elements: [[1, 2], "hello"]
  }
];
console.log(extracted);
sendMessage(extracted);`
      }
    ],
    async ({ code, selection = Selection.cursorAt(0, 12), expected }) => {
      askUser = jest.fn(([all_occurrence]) => Promise.resolve(all_occurrence));

      const result = await doExtractVariable(code, selection);

      expect(result.code).toBe(expected);
    }
  );

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
