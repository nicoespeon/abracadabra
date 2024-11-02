import { ErrorReason } from "../error-reason";
import { AttemptingEditor } from "./attempting-editor";
import { InMemoryEditor } from "./in-memory-editor";

describe("AttemptingEditor", () => {
  const EXPECTED_REASON = ErrorReason.DidNotFindInlinableCode;
  const ANY_OTHER_REASON = ErrorReason.DidNotFindLetToConvertToConst;

  describe("reason is expected", () => {
    it("should not ask editor to show error", async () => {
      const editor = new InMemoryEditor("// irrelevant");
      jest.spyOn(editor, "showError");
      const attemptingEditor = new AttemptingEditor(editor, EXPECTED_REASON);

      attemptingEditor.showError(EXPECTED_REASON);

      expect(editor.showError).not.toHaveBeenCalled();
    });

    it("should say attempt didn't succeeded", async () => {
      const editor = new InMemoryEditor("// irrelevant");
      const attemptingEditor = new AttemptingEditor(editor, EXPECTED_REASON);
      expect(attemptingEditor.attemptSucceeded).toBe(true);

      attemptingEditor.showError(EXPECTED_REASON);

      expect(attemptingEditor.attemptSucceeded).toBe(false);
    });
  });

  describe("reason is not expected", () => {
    it("should ask editor to show error", async () => {
      const editor = new InMemoryEditor("// irrelevant");
      jest.spyOn(editor, "showError");
      const attemptingEditor = new AttemptingEditor(editor, EXPECTED_REASON);

      attemptingEditor.showError(ANY_OTHER_REASON);

      expect(editor.showError).toHaveBeenCalledTimes(1);
      expect(editor.showError).toHaveBeenCalledWith(ANY_OTHER_REASON);
    });

    it("should say attempt succeeded", async () => {
      const editor = new InMemoryEditor("// irrelevant");
      const attemptingEditor = new AttemptingEditor(editor, EXPECTED_REASON);

      attemptingEditor.showError(ANY_OTHER_REASON);

      expect(attemptingEditor.attemptSucceeded).toBe(true);
    });
  });
});
