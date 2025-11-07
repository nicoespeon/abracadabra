import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Position } from "../../editor/position";
import { executeRefactoring } from "../../refactorings";
import { toggleHighlight } from "../toggle-highlight/toggle-highlight";
import { refreshHighlights } from "./refresh-highlights";

describe("Refresh Highlights", () => {
  it("should highlight newly inserted references and increment the decoration", async () => {
    const editor = new InMemoryEditor(`const someVariable[cursor] = 123;
console.log("test");`);
    await executeRefactoring(toggleHighlight, editor);
    expect(editor.highlightedCode).toBe(`const [h1]someVariable[/h1] = 123;
console.log("test");`);

    await editor.insert(", someVariable", new Position(1, 18));
    await executeRefactoring(refreshHighlights, editor);

    expect(editor.highlightedCode).toBe(`const [h1]someVariable[/h1] = 123;
console.log("test", [h1]someVariable[/h1]);`);
  });
});
