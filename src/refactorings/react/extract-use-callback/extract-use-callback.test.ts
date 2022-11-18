import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { Code, ErrorReason } from "../../../editor/editor";
import { testEach } from "../../../tests-helpers";
import { extractUseCallback } from "./extract-use-callback";

describe("Extract useCallback", () => {
  testEach<{ code: Code; expected: Code }>(
    "should extract useCallback from an inline function",
    [
      {
        description: "arrow expression",
        code: `
function Bar() {
  return <Foo onFoo={[cursor](e) => console.log(e)} />;
}`,
        expected: `
function Bar() {
  const onFoo = useCallback(e => console.log(e), []);
  return <Foo onFoo={onFoo} />;
}`
      },
      {
        description: "function expression",
        code: `
function Bar() {
  return (
    <Foo onFoo={[cursor]function handleFoo() {
      console.log(e);
    }} />
  );
}`,
        expected: `
function Bar() {
  const onFoo = useCallback(function handleFoo() {
    console.log(e);
  }, []);

  return (<Foo onFoo={onFoo} />);
}`
      },
      {
        description: "uses a unique name",
        code: `
function Bar({onFoo}) {
  return <Foo onFoo={[cursor](e) => {console.log(e); onFoo(e); }} />;
}`,
        expected: `
function Bar({onFoo}) {
  const onFoo2 = useCallback(e => {console.log(e); onFoo(e); }, [onFoo]);
  return <Foo onFoo={onFoo2} />;
}`
      },
      {
        description: "adds dependencies using react-hooks/exhaustive-deps",
        code: `
function Bar({a, b, c}) {
  return <Foo onFoo={[cursor]() => a(b, c)} />;
}`,
        expected: `
function Bar({a, b, c}) {
  const onFoo = useCallback(() => a(b, c), [a, b, c]);
  return <Foo onFoo={onFoo} />;
}`
      },
      {
        description: "adds a block if necessary",
        code: `
const Bar = () => <Foo onFoo={[cursor](e) => {console.log(e); onFoo(e); }} />;`,
        expected: `
const Bar = () => {
  const onFoo = useCallback(e => {console.log(e); onFoo(e); }, []);
  return <Foo onFoo={onFoo} />;
};`
      },
      {
        description: "supports TS code",
        code: `
function Bar({a, b, c}: {a: Function, b: string, c: number}) {
  return <Foo onFoo={[cursor]() => a(b, c)} />;
}`,
        expected: `
function Bar({a, b, c}: {a: Function, b: string, c: number}) {
  const onFoo = useCallback(() => a(b, c), [a, b, c]);
  return <Foo onFoo={onFoo} />;
}`
      },
      {
        description: "async functions",
        code: `
function Bar({a, b, c}) {
  return <Foo onFoo={[cursor]async () => await a(b, c)} />;
}`,
        expected: `
function Bar({a, b, c}) {
  const onFoo = useCallback(async () => await a(b, c), [a, b, c]);
  return <Foo onFoo={onFoo} />;
}`
      }
    ].map(({ description, code, expected }) => ({
      description,
      code: code.trim(),
      expected: expected.trim()
    })),

    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await extractUseCallback(editor);

      expect(editor.code).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await extractUseCallback(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindExtractUseCallback
    );
  });
});
