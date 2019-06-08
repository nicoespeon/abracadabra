import { UpdateWith, Update } from "./i-update-code";
import { inlineVariable } from "./inline-variable";
import { Selection } from "./selection";

describe("Inline Variable", () => {
  let updateWith: UpdateWith;
  let updates: Update[] = [];

  beforeEach(() => {
    updateWith = jest
      .fn()
      .mockImplementation(
        (_, getUpdates) => (updates = getUpdates('"Hello!"'))
      );
  });

  describe("update code with variable value", () => {
    const code = `const foo = "bar";
    console.log(foo);`;

    it.each<[string, Selection]>([
      ["all variable declaration is selected", new Selection([0, 0], [0, 18])],
      ["cursor is on value", Selection.cursorAt(0, 14)],
      ["cursor is on identifier", Selection.cursorAt(0, 7)],
      ["cursor is on declarator", Selection.cursorAt(0, 2)]
    ])("should select variable value if %s", async (_, selection) => {
      await inlineVariable(code, selection, updateWith);

      expect(updateWith).toBeCalledWith(
        new Selection([0, 12], [0, 17]),
        expect.any(Function)
      );
    });
  });

  it("should inline the variable value that matches selection", async () => {
    const code = `const foo = "bar";
const hello = "World!";
console.log(foo);`;
    const selection = new Selection([0, 0], [0, 18]);

    await inlineVariable(code, selection, updateWith);

    expect(updateWith).toBeCalledWith(
      new Selection([0, 12], [0, 17]),
      expect.any(Function)
    );
  });

  it("should update code to inline selection where it's referenced", async () => {
    const code = `const hello = "Hello!";
console.log(hello);`;
    const selection = Selection.cursorAt(0, 14);

    await inlineVariable(code, selection, updateWith);

    expect(updates).toEqual([
      {
        code: '"Hello!"',
        selection: new Selection([1, 12], [1, 17])
      },
      {
        code: "",
        selection: new Selection([0, 0], [1, 0])
      }
    ]);
  });
});
