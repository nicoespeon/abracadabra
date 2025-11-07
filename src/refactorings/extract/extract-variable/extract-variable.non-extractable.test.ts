import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { Code } from "../../../editor/editor";
import { extractVariable } from "./extract-variable";

describe("Extract Variable - Patterns we can't extract", () => {
  it("should not extract a function declaration", () => {
    shouldNotExtract({
      code: `[start]function sayHello() {
  console.log("hello");
}[end]`
    });
  });

  it("should not extract a class property identifier", () => {
    shouldNotExtract({
      code: `class Logger {
  [start]message[end] = "Hello!";
}`
    });
  });

  it("should not extract the identifier from a variable declaration", () => {
    shouldNotExtract({
      code: `const [start]foo[end] = "bar";`
    });
  });

  it("should not extract a type annotation", () => {
    shouldNotExtract({
      code: `const toto: s[cursor]tring = "";`
    });
  });

  it("should not extract a generic type parameter instantiation", () => {
    shouldNotExtract({
      code: `useState<[start]"all" | "local"[end]>("all");`
    });
  });

  it("should not extract a return statement with no argument", () => {
    shouldNotExtract({
      code: `function addNumbers(arr: number[]): number {
  return[cursor];
}`
    });
  });
});

function shouldNotExtract({ code }: { code: Code }) {
  const editor = new InMemoryEditor(code);
  const result = extractVariable({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });

  expect(result.action).toBe("show error");
}
