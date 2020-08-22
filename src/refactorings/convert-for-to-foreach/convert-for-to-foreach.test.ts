import { ErrorReason, Code } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { convertForToForeach } from "./convert-for-to-foreach";

describe("Convert For To Foreach", () => {
  testEach<{ code: Code; expected: Code }>(
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

[cursor]for (let i = 0; i < items.length; i++) {
  console.log(items[i]);
}`,
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

  [cursor]for (let j = 0; j < items.length; j++) {
    console.log(items[j]);
  }
}`,
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

  [cursor]for (let j = 0; j < 10; j++) {
    console.log(items[j]);
  }
}`,
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
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await convertForToForeach(editor);

      expect(editor.code).toBe(expected);
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
      const editor = new InMemoryEditor(code);
      const originalCode = editor.code;

      await convertForToForeach(editor);

      expect(editor.code).toBe(originalCode);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await convertForToForeach(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindForLoopToConvert
    );
  });
});
