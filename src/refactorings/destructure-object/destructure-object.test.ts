import { ErrorReason, Code } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { destructureObject } from "./destructure-object";

describe("Destructure Object", () => {
  testEach<{ code: Code; expected: Code }>(
    "should destructure object",
    [
      {
        description: "basic scenario",
        code: `interface MyComponentProps {
  name: string;
  age: number;
}

const MyComponent = (props[cursor]: MyComponentProps) => {};`,
        expected: `interface MyComponentProps {
  name: string;
  age: number;
}

const MyComponent = (
  {
    name,
    age
  }: MyComponentProps
) => {};`
      }
      // TODO: actually compute it (need type checker like hocus-pocus)
      // TODO: test if type is inlined
      // TODO: should not refactor if type isn't object-like
      // TODO: infer type from TS usage
      // TODO: propagate usage inside body
      // TODO: not all identifiers (e.g. call expression)
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await destructureObject(editor);

      expect(editor.code).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await destructureObject(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindObjectToDestructure
    );
  });
});
