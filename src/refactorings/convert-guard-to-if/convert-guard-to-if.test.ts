import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code } from "../../editor/editor";
import { convertGuardToIf } from "./convert-guard-to-if";

describe("Convert Guard To If", () => {
  it("should convert guard on single condition", () => {
    shouldConvertGuardToIf({
      code: `condition && callback();`,
      expected: `if (condition) {
  callback();
}`
    });
  });

  it("should convert guard on multiple conditions", () => {
    shouldConvertGuardToIf({
      code: `condition1 && condition2 && callback();`,
      expected: `if (condition1 && condition2) {
  callback();
}`
    });
  });

  it("should not convert expression if the right hand side is not a call expression", () => {
    shouldNotConvert(`condition1 && condition2`);
  });

  it("should not convert expression if operator is not &&", () => {
    shouldNotConvert(`condition || callback();`);
  });

  it("should not convert guard clause that is being returend", () => {
    shouldNotConvert(`return [cursor]condition && callback();`);
  });

  it("should show an error message if refactoring can't be made", () => {
    shouldNotConvert(`// This is a comment, can't be refactored`);
  });
});

function shouldConvertGuardToIf({
  code,
  expected
}: {
  code: Code;
  expected: Code;
}) {
  const editor = new InMemoryEditor(code);

  const result = convertGuardToIf({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });

  expect(result).toMatchObject({ action: "write", code: expected });
}

function shouldNotConvert(code: Code) {
  const editor = new InMemoryEditor(code);

  const result = convertGuardToIf({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });

  expect(result.action).toBe("show error");
}
