import { InMemoryEditor } from "./editor/adapters/in-memory-editor";
import { Position } from "./editor/position";
import { Selection } from "./editor/selection";
import { executeRefactoring, Refactoring__NEW } from "./refactorings";

describe("Execute Refactoring", () => {
  it("should not crash for 'do nothing'", async () => {
    const fakeRefactoring: Refactoring__NEW = () => ({ action: "do nothing" });
    const editor = new InMemoryEditor();

    await expect(
      executeRefactoring(fakeRefactoring, editor)
    ).resolves.not.toThrow();
  });

  it("should make editor show an error for 'show error'", async () => {
    const reason = "This is an error message";
    const fakeRefactoring: Refactoring__NEW = () => ({
      action: "show error",
      reason
    });
    const editor = new InMemoryEditor();
    jest.spyOn(editor, "showError");

    await executeRefactoring(fakeRefactoring, editor);

    expect(editor.showError).toHaveBeenCalledWith(reason);
  });

  it("should make the editor replace code with new content for 'write'", async () => {
    const code = "const hello = 'world'";
    const fakeRefactoring: Refactoring__NEW = () => ({
      action: "write",
      code
    });
    const editor = new InMemoryEditor("const some = 'code';");

    await executeRefactoring(fakeRefactoring, editor);

    expect(editor.code).toBe(code);
  });

  it("should put cursor at given position for 'write'", async () => {
    const fakeRefactoring: Refactoring__NEW = () => ({
      action: "write",
      code: "const hello = 'world'",
      newCursorPosition: new Position(0, 5)
    });
    const editor = new InMemoryEditor("const some[cursor] = 'code';");
    expect(editor.selection).toEqual(Selection.cursorAt(0, 10));

    await executeRefactoring(fakeRefactoring, editor);

    expect(editor.selection).toEqual(Selection.cursorAt(0, 5));
  });

  it("should delegate given command to the editor for 'delegate'", async () => {
    const fakeRefactoring: Refactoring__NEW = () => ({
      action: "delegate",
      command: "rename symbol"
    });
    const editor = new InMemoryEditor();
    jest.spyOn(editor, "delegate");

    await executeRefactoring(fakeRefactoring, editor);

    expect(editor.delegate).toHaveBeenCalledWith("rename symbol");
  });

  it("should call refactoring back when command is not supported for 'delegate'", async () => {
    const fakeRefactoring: Refactoring__NEW = jest.fn(() => ({
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

  it("should ask user for input for 'ask user'", async () => {
    const fakeRefactoring: Refactoring__NEW = jest
      .fn()
      .mockReturnValueOnce({
        action: "ask user",
        value: "hello"
      })
      .mockReturnValue({ action: "do nothing" });
    const editor = new InMemoryEditor();
    jest.spyOn(editor, "askUserInput");

    await executeRefactoring(fakeRefactoring, editor);

    expect(editor.askUserInput).toHaveBeenCalledWith("hello");
  });

  it("should call refactoring back with user input for 'ask user'", async () => {
    const fakeRefactoring: Refactoring__NEW = jest
      .fn()
      .mockReturnValueOnce({
        action: "ask user",
        value: "hello"
      })
      .mockReturnValue({ action: "do nothing" });
    const editor = new InMemoryEditor("const[cursor] hello = 'world'");
    jest.spyOn(editor, "askUserInput").mockResolvedValueOnce("newName");

    await executeRefactoring(fakeRefactoring, editor);

    expect(fakeRefactoring).toHaveBeenCalledTimes(2);
    expect(fakeRefactoring).toHaveBeenLastCalledWith({
      state: "user response",
      value: "newName",
      code: "const hello = 'world'",
      selection: Selection.cursorAt(0, 5)
    });
  });
});
