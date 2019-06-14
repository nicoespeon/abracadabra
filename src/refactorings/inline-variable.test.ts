import { UpdateWith, Update, Code } from "./i-update-code";
import { inlineVariable } from "./inline-variable";
import { ShowErrorMessage, ErrorReason } from "./i-show-error-message";
import { Selection } from "./selection";

describe("Inline Variable", () => {
  let showErrorMessage: ShowErrorMessage;
  let updateWith: UpdateWith;
  let updates: Update[] = [];
  const inlinableCode = "Hello!";

  beforeEach(() => {
    showErrorMessage = jest.fn();
    updateWith = jest
      .fn()
      .mockImplementation(
        (_, getUpdates) => (updates = getUpdates(inlinableCode))
      );
  });

  it.each<[string, Selection]>([
    ["all variable declaration is selected", new Selection([0, 0], [0, 18])],
    ["cursor is on value", Selection.cursorAt(0, 14)],
    ["cursor is on identifier", Selection.cursorAt(0, 7)],
    ["cursor is on declarator", Selection.cursorAt(0, 2)]
  ])("should select variable value if %s", async (_, selection) => {
    const code = `const foo = "bar";
console.log(foo);`;

    await doInlineVariable(code, selection);

    expect(updateWith).toBeCalledWith(
      new Selection([0, 12], [0, 17]),
      expect.any(Function)
    );
  });

  it("should inline the variable value that matches selection", async () => {
    const code = `const foo = "bar";
const hello = "World!";
console.log(foo);`;
    const selection = new Selection([0, 0], [0, 18]);

    await doInlineVariable(code, selection);

    expect(updateWith).toBeCalledWith(
      new Selection([0, 12], [0, 17]),
      expect.any(Function)
    );
  });

  it("should update code to inline selection where it's referenced (1 reference)", async () => {
    const code = `const hello = ${inlinableCode};
console.log(hello);`;
    const selection = Selection.cursorAt(0, 14);

    await doInlineVariable(code, selection);

    expect(updates).toEqual([
      {
        code: inlinableCode,
        selection: new Selection([1, 12], [1, 17])
      },
      {
        code: "",
        selection: new Selection([0, 0], [1, 0])
      }
    ]);
  });

  it("should update code to inline selection where it's referenced (many references)", async () => {
    const code = `const hello = ${inlinableCode};
console.log(hello);
sendMessageSaying(hello).to(world);`;
    const selection = Selection.cursorAt(0, 14);

    await doInlineVariable(code, selection);

    expect(updates).toEqual([
      {
        code: inlinableCode,
        selection: new Selection([1, 12], [1, 17])
      },
      {
        code: inlinableCode,
        selection: new Selection([2, 18], [2, 23])
      },
      {
        code: "",
        selection: new Selection([0, 0], [1, 0])
      }
    ]);
  });

  it("should limit inlining to variable declaration scope", async () => {
    const code = `function sayHello() {
  const hello = ${inlinableCode};
  console.log(hello);
}

console.log(hello);`;
    const selection = Selection.cursorAt(1, 14);

    await doInlineVariable(code, selection);

    expect(updates).toEqual([
      {
        code: inlinableCode,
        selection: new Selection([2, 14], [2, 19])
      },
      {
        code: "",
        selection: new Selection([1, 0], [2, 0])
      }
    ]);
  });

  it("should limit inlining to variables that are not shadowed", async () => {
    const code = `const hello = ${inlinableCode};
console.log(hello);

function sayHello(yo, hello) {
  console.log(hello);
}`;
    const selection = Selection.cursorAt(0, 14);

    await doInlineVariable(code, selection);

    expect(updates).toEqual([
      {
        code: inlinableCode,
        selection: new Selection([1, 12], [1, 17])
      },
      {
        code: "",
        selection: new Selection([0, 0], [1, 0])
      }
    ]);
  });

  it("should inline variable if export is outside of declaration scope", async () => {
    const code = `function sayHello() {
  const hello = ${inlinableCode};
  console.log(hello);
}

const hello = "Some other thing";
export { hello };`;
    const selection = Selection.cursorAt(1, 14);

    await doInlineVariable(code, selection);

    expect(updates).toEqual([
      {
        code: inlinableCode,
        selection: new Selection([2, 14], [2, 19])
      },
      {
        code: "",
        selection: new Selection([1, 0], [2, 0])
      }
    ]);
  });

  describe("multiple variables declaration", () => {
    const code = `const one = 1, two = 2, three = 3;
const result = one + two + three;`;

    it("should select the correct variable value", async () => {
      const selection = Selection.cursorAt(0, 15);

      await doInlineVariable(code, selection);

      expect(updateWith).toBeCalledWith(
        new Selection([0, 21], [0, 22]),
        expect.any(Function)
      );
    });

    it.each<[string, { selection: Selection; expectedSelection: Selection }]>([
      [
        "basic scenario",
        {
          selection: Selection.cursorAt(0, 15),
          expectedSelection: new Selection([0, 15], [0, 24])
        }
      ],
      [
        "last variable",
        {
          selection: Selection.cursorAt(0, 24),
          expectedSelection: new Selection([0, 22], [0, 33])
        }
      ],
      [
        "first variable",
        {
          selection: Selection.cursorAt(0, 6),
          expectedSelection: new Selection([0, 6], [0, 15])
        }
      ]
    ])(
      "should only remove the inlined variable (%s)",
      async (_, { selection, expectedSelection }) => {
        await doInlineVariable(code, selection);

        expect(updates[1]).toEqual({
          code: "",
          selection: expectedSelection
        });
      }
    );

    it("should not inline code if cursor is not explicitly on one of the variables", async () => {
      const selectionOnDeclarator = Selection.cursorAt(0, 0);

      await doInlineVariable(code, selectionOnDeclarator);

      expect(showErrorMessage).toBeCalledWith(
        ErrorReason.DidNotFoundInlinableCode
      );
    });

    it("should work on multi-lines declarations", async () => {
      const code = `const one = 1,
  two = 2,
  three = 3;
    const result = one + two + three;`;
      const selection = Selection.cursorAt(1, 2);

      await doInlineVariable(code, selection);

      expect(updates[1]).toEqual({
        code: "",
        selection: new Selection([1, 2], [2, 2])
      });
    });
  });

  // ✋ Patterns that can't be inlined

  it("should show an error message if selection is not inlinable", async () => {
    const code = `console.log("Nothing to inline here!")`;
    const selection = Selection.cursorAt(0, 0);

    await doInlineVariable(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundInlinableCode
    );
  });

  it("should show an error message if variable is not used", async () => {
    const code = `const hello = "Hello!";`;
    const selection = Selection.cursorAt(0, 0);

    await doInlineVariable(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundInlinableCodeIdentifiers
    );
  });

  it.each<[string, { code: Code; selection: Selection }]>([
    [
      "export declaration",
      {
        code: `export const foo = "bar", hello = "world";
console.log(foo);`,
        selection: Selection.cursorAt(0, 19)
      }
    ],
    [
      "export after declaration",
      {
        code: `const foo = "bar", hello = "world";
console.log(foo);

export { hello, foo };`,
        selection: Selection.cursorAt(0, 12)
      }
    ],
    [
      "export before declaration",
      {
        code: `export { foo };
const foo = "bar", hello = "world";
console.log(foo);`,
        selection: Selection.cursorAt(1, 12)
      }
    ],
    [
      "default export after declaration",
      {
        code: `const foo = "bar", hello = "world";
console.log(foo);

export default foo;`,
        selection: Selection.cursorAt(0, 12)
      }
    ]
  ])(
    "should not inline an exported variable (%s)",
    async (_, { code, selection }) => {
      await doInlineVariable(code, selection);

      expect(showErrorMessage).toBeCalledWith(
        ErrorReason.CantInlineExportedVariables
      );
    }
  );

  async function doInlineVariable(code: Code, selection: Selection) {
    await inlineVariable(code, selection, updateWith, showErrorMessage);
  }
});
