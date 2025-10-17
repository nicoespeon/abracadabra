import { InMemoryEditor } from "./editor/adapters/in-memory-editor";
import { Position } from "./editor/position";
import { Selection } from "./editor/selection";
import { executeRefactoring, Refactoring } from "./refactorings";

describe("Execute Refactoring", () => {
  it("should not crash for 'do nothing'", async () => {
    const fakeRefactoring: Refactoring = () => ({ action: "do nothing" });
    const editor = new InMemoryEditor();

    await expect(
      executeRefactoring(fakeRefactoring, editor)
    ).resolves.not.toThrow();
  });

  it("should make editor show an error for 'show error'", async () => {
    const reason = "This is an error message";
    const fakeRefactoring: Refactoring = () => ({
      action: "show error",
      reason,
      details: { trace: "Some trace" }
    });
    const editor = new InMemoryEditor();
    jest.spyOn(editor, "showError");

    await executeRefactoring(fakeRefactoring, editor);

    expect(editor.showError).toHaveBeenCalledWith(reason, {
      trace: "Some trace"
    });
  });

  it("should make the editor replace code with new content for 'write'", async () => {
    const code = "const hello = 'world'";
    const fakeRefactoring: Refactoring = () => ({
      action: "write",
      code
    });
    const editor = new InMemoryEditor("const some = 'code';");

    await executeRefactoring(fakeRefactoring, editor);

    expect(editor.code).toBe(code);
  });

  it("should put cursor at given position for 'write'", async () => {
    const fakeRefactoring: Refactoring = () => ({
      action: "write",
      code: "const hello = 'world'",
      newCursorPosition: new Position(0, 5)
    });
    const editor = new InMemoryEditor("const some[cursor] = 'code';");
    expect(editor.selection).toEqual(Selection.cursorAt(0, 10));

    await executeRefactoring(fakeRefactoring, editor);

    expect(editor.selection).toEqual(Selection.cursorAt(0, 5));
  });

  it("should run given refactoring function if provided for 'write'", async () => {
    const code = "const hello = 'world'";
    const followUpRefactoring: Refactoring = jest
      .fn()
      .mockReturnValue({ action: "do nothing" });
    const fakeRefactoring: Refactoring = () => ({
      action: "write",
      code,
      newCursorPosition: new Position(0, 5),
      thenRun: followUpRefactoring
    });
    const editor = new InMemoryEditor("const some = '[cursor]code';");

    await executeRefactoring(fakeRefactoring, editor);

    expect(followUpRefactoring).toHaveBeenCalledWith({
      state: "new",
      code,
      selection: Selection.cursorAt(0, 5)
    });
  });

  it("should make the editor return the code at given selection, then execute modifications for 'read then write'", async () => {
    const editor = new InMemoryEditor("const hello = [start]'world'[end]");
    const fakeRefactoring: Refactoring = () => ({
      action: "read then write",
      readSelection: editor.selection,
      getModifications: (readCode) => [
        {
          code: `let world = ${readCode};`,
          selection: Selection.fromPositions(
            new Position(0, 0),
            new Position(0, 21)
          )
        },
        {
          code: `\nconst anotherOne = ${readCode};`,
          selection: Selection.cursorAt(0, 21)
        }
      ]
    });

    await executeRefactoring(fakeRefactoring, editor);

    expect(editor.code).toBe(`let world = 'world';
const anotherOne = 'world';`);
  });

  it("should put cursor at given position for 'read then write'", async () => {
    const editor = new InMemoryEditor("const hello = [start]'world'[end]");
    const fakeRefactoring: Refactoring = () => ({
      action: "read then write",
      readSelection: editor.selection,
      getModifications: () => [],
      newCursorPosition: new Position(0, 5)
    });
    expect(editor.selection).toEqual(
      Selection.fromPositions(new Position(0, 14), new Position(0, 21))
    );

    await executeRefactoring(fakeRefactoring, editor);

    expect(editor.selection).toEqual(Selection.cursorAt(0, 5));
  });

  it("should delegate given command to the editor for 'delegate'", async () => {
    const fakeRefactoring: Refactoring = () => ({
      action: "delegate",
      command: "rename symbol"
    });
    const editor = new InMemoryEditor();
    jest.spyOn(editor, "delegate");

    await executeRefactoring(fakeRefactoring, editor);

    expect(editor.delegate).toHaveBeenCalledWith("rename symbol", undefined);
  });

  it("should call refactoring back when command is not supported for 'delegate'", async () => {
    const fakeRefactoring: Refactoring = jest.fn(() => ({
      action: "delegate",
      command: "rename symbol"
    }));
    const editor = new InMemoryEditor("const hello[cursor] = 'world'");
    jest.spyOn(editor, "delegate").mockResolvedValueOnce("not supported");

    await executeRefactoring(fakeRefactoring, editor);

    expect(fakeRefactoring).toHaveBeenCalledTimes(2);
    expect(fakeRefactoring).toHaveBeenLastCalledWith({
      state: "command not supported",
      code: "const hello = 'world'",
      selection: Selection.cursorAt(0, 11)
    });
  });

  it("should run given refactoring function if provided for 'delegate'", async () => {
    const followUpRefactoring: Refactoring = jest
      .fn()
      .mockReturnValue({ action: "do nothing" });
    const fakeRefactoring: Refactoring = () => ({
      action: "delegate",
      command: "rename symbol",
      thenRun: followUpRefactoring
    });
    const editor = new InMemoryEditor("const hello[cursor] = 'world'");

    await executeRefactoring(fakeRefactoring, editor);

    expect(followUpRefactoring).toHaveBeenCalledWith({
      state: "new",
      code: "const hello = 'world'",
      selection: Selection.cursorAt(0, 11)
    });
  });

  it("should NOT run follow-up refactoring function if delegated method is not supported for 'delegate'", async () => {
    const followUpRefactoring: Refactoring = jest
      .fn()
      .mockReturnValue({ action: "do nothing" });
    const fakeRefactoring: Refactoring = jest
      .fn()
      .mockReturnValueOnce({
        action: "delegate",
        command: "rename symbol",
        thenRun: followUpRefactoring
      })
      .mockReturnValue({ action: "do nothing" });
    const editor = new InMemoryEditor("const hello[cursor] = 'world'");
    jest.spyOn(editor, "delegate").mockResolvedValueOnce("not supported");

    await executeRefactoring(fakeRefactoring, editor);

    expect(followUpRefactoring).not.toHaveBeenCalled();
  });

  it("should ask user for input for 'ask user'", async () => {
    const fakeRefactoring: Refactoring = jest
      .fn()
      .mockReturnValueOnce({
        action: "ask user input",
        value: "hello"
      })
      .mockReturnValue({ action: "do nothing" });
    const editor = new InMemoryEditor();
    jest.spyOn(editor, "askUserInput");

    await executeRefactoring(fakeRefactoring, editor);

    expect(editor.askUserInput).toHaveBeenCalledWith("hello");
  });

  it("should call refactoring back with user input for 'ask user'", async () => {
    const fakeRefactoring: Refactoring = jest
      .fn()
      .mockReturnValueOnce({
        action: "ask user input",
        value: "hello"
      })
      .mockReturnValue({ action: "do nothing" });
    const editor = new InMemoryEditor("const[cursor] hello = 'world'");
    jest.spyOn(editor, "askUserInput").mockResolvedValueOnce("newName");

    await executeRefactoring(fakeRefactoring, editor);

    expect(fakeRefactoring).toHaveBeenCalledTimes(2);
    expect(fakeRefactoring).toHaveBeenLastCalledWith({
      state: "user input response",
      value: "newName",
      code: "const hello = 'world'",
      selection: Selection.cursorAt(0, 5)
    });
  });
});
