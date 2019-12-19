import { Editor, ErrorReason, Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { convertForToForeach } from "./convert-for-to-foreach";

describe("Convert For To Foreach", () => {
  let showErrorMessage: Editor["showError"];

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; selection?: Selection; expected: Code }>(
    "should convert for to foreach",
    [
      {
        description: "basic for-loop",
        code: `for (let i = 0; i < items.length; i++) {
  console.log(items[i]);
}`,
        expected: `items.forEach(item => {
  console.log(item);
});`
      },
      {
        description: "for-loop with member expressions we can't replace",
        code: `for (let i = 0; i < items.length; i++) {
  console.log(items[i]);
  console.log(items[3]);
}`,
        expected: `items.forEach(item => {
  console.log(item);
  console.log(items[3]);
});`
      },
      {
        description: "selected for-loop only",
        code: `for (let i = 0; i < items.length; i++) {
  console.log(items[i]);
}

for (let i = 0; i < items.length; i++) {
  console.log(items[i]);
}`,
        selection: Selection.cursorAt(4, 0),
        expected: `for (let i = 0; i < items.length; i++) {
  console.log(items[i]);
}

items.forEach(item => {
  console.log(item);
});`
      },
      {
        description: "nested for-loop, cursor on wrapper",
        code: `for (let i = 0; i < items.length; i++) {
  console.log(items[i]);

  for (let j = 0; j < items.length; j++) {
    console.log(items[j]);
  }
}`,
        selection: Selection.cursorAt(0, 0),
        expected: `items.forEach(item => {
  console.log(item);

  for (let j = 0; j < items.length; j++) {
    console.log(items[j]);
  }
});`
      },
      {
        description: "nested for-loop, cursor on nested",
        code: `for (let i = 0; i < items.length; i++) {
  console.log(items[i]);

  for (let j = 0; j < items.length; j++) {
    console.log(items[j]);
  }
}`,
        selection: Selection.cursorAt(3, 2),
        expected: `for (let i = 0; i < items.length; i++) {
  console.log(items[i]);

  items.forEach(item => {
    console.log(item);
  });
}`
      },
      {
        description: "nested for-loop, cursor on nested, nested invalid",
        code: `for (let i = 0; i < items.length; i++) {
  console.log(items[i]);

  for (let j = 0; j < 10; j++) {
    console.log(items[j]);
  }
}`,
        selection: Selection.cursorAt(3, 2),
        expected: `items.forEach(item => {
  console.log(item);

  for (let j = 0; j < 10; j++) {
    console.log(items[j]);
  }
});`
      },
      {
        description: "for-loop without block statement",
        code: `for (let i = 0; i < items.length; i++)
  console.log(items[i]);`,
        expected: `items.forEach(item => {
  console.log(item);
});`
      },
      {
        description: "accessor referenced inside the body",
        code: `for (let i = 0; i < items.length; i++) {
  console.log(items[i]);
  console.log(i);
}`,
        expected: `items.forEach((item, i) => {
  console.log(item);
  console.log(i);
});`
      },
      {
        description: "lesser or equal",
        code: `for (let i = 0; i <= items.length - 1; i++) {
  console.log(items[i]);
}`,
        expected: `items.forEach(item => {
  console.log(item);
});`
      },
      {
        description: "decrementing accessor",
        code: `for (let i = items.length - 1; i >= 0; i--) {
  console.log(items[i]);
}`,
        expected: `items.forEach(item => {
  console.log(item);
});`
      },
      {
        description: "decrementing accessor, strict greater than",
        code: `for (let i = items.length - 1; i > -1; i--) {
  console.log(items[i]);
}`,
        expected: `items.forEach(item => {
  console.log(item);
});`
      },
      {
        description: "list is a member expression itself",
        code: `for (let i = 0; i < this.data[0].items.length; i++) {
  console.log(this.data[0].items[i]);
}`,
        expected: `this.data[0].items.forEach(item => {
  console.log(item);
});`
      }
    ],
    async ({ code, selection = Selection.cursorAt(0, 0), expected }) => {
      const result = await doConvertForToForeach(code, selection);

      expect(result).toBe(expected);
    }
  );

  testEach<{ code: Code }>(
    "should not convert",
    [
      {
        description: "standard for-loop",
        code: `for (let i = 0; i < 10; i++) {
  console.log(items[i]);
}`
      },
      {
        description: "not using the list length to iterate",
        code: `for (let i = 0; i < items.count; i++) {
  console.log(items[i]);
}`
      },
      {
        description: "for-loop with init not starting at 0",
        code: `for (let i = 1; i < items.length; i++) {
  console.log(items[i]);
}`
      }
    ],
    async ({ code }) => {
      const selection = Selection.cursorAt(0, 0);

      const result = await doConvertForToForeach(code, selection);

      expect(result).toBe(code);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const selection = Selection.cursorAt(0, 0);

    await doConvertForToForeach(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundForLoopToConvert
    );
  });

  async function doConvertForToForeach(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const editor = new InMemoryEditor(code);
    editor.showError = showErrorMessage;
    await convertForToForeach(code, selection, editor);
    return editor.code;
  }
});
